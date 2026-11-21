"""Optional loopback-only API example. Static public demo does not call this service."""

import argparse, gzip, hashlib, json, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from pipeline.build import validate

ROOT = Path(__file__).resolve().parents[1]


class SnapshotStore:
    def __init__(self, path):
        self.path = Path(path)
        self._lock = threading.Lock()
        self._cache = None
        self._version = None

    def snapshot(self):
        with self._lock:
            degraded = False
            try:
                stat = self.path.stat()
                version = (stat.st_mtime_ns, stat.st_size)
                if version != self._version:
                    data = validate(json.loads(self.path.read_text()))
                    self._cache = data
                    self._version = version
            except (OSError, ValueError, KeyError, TypeError):
                if self._cache is None:
                    raise ValueError("No validated snapshot available") from None
                degraded = True
            payload = {
                "source_state": "degraded" if degraded else "current",
                "catalog": self._cache,
            }
            body = json.dumps(
                payload, separators=(",", ":"), ensure_ascii=False, allow_nan=False
            ).encode()
            return body, 'W/"' + hashlib.sha256(body).hexdigest() + '"', degraded


def accepts_gzip(header):
    for entry in header.lower().split(","):
        parts = [x.strip() for x in entry.split(";")]
        if parts[0] != "gzip":
            continue
        try:
            return all(float(x[2:]) > 0 for x in parts[1:] if x.startswith("q="))
        except ValueError:
            return False
    return False


def handler_for(store):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def json_response(self, status, obj):
            raw = json.dumps(obj).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(raw)

        def do_GET(self):
            if self.path == "/healthz":
                return self.json_response(200, {"process": "up"})
            if self.path not in {"/api/catalog", "/readyz"}:
                return self.json_response(404, {"error": "not_found"})
            try:
                raw, etag, degraded = store.snapshot()
            except ValueError:
                return self.json_response(503, {"error": "snapshot_unavailable"})
            if self.path == "/readyz":
                return self.json_response(
                    503 if degraded else 200, {"validated_source": not degraded}
                )
            if self.headers.get("If-None-Match") == etag:
                self.send_response(304)
                self.send_header("ETag", etag)
                self.send_header("Vary", "Accept-Encoding")
                self.end_headers()
                return
            compressed = accepts_gzip(self.headers.get("Accept-Encoding", ""))
            # The validator is weak because gzip changes the response representation.
            if compressed:
                raw = gzip.compress(raw, compresslevel=5, mtime=0)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("ETag", etag)
            self.send_header("Vary", "Accept-Encoding")
            self.send_header("Cache-Control", "no-cache")
            self.send_header(
                "X-Demo-Source-State", "degraded" if degraded else "current"
            )
            if compressed:
                self.send_header("Content-Encoding", "gzip")
            self.end_headers()
            self.wfile.write(raw)

    return Handler


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8010)
    args = parser.parse_args()
    server = ThreadingHTTPServer(
        ("127.0.0.1", args.port),
        handler_for(SnapshotStore(ROOT / "docs/data/catalog.json")),
    )
    print(f"Demo-only API on loopback port {args.port}")
    server.serve_forever()

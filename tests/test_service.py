import gzip, json, tempfile, threading, unittest, urllib.request, urllib.error
from pathlib import Path
from http.server import ThreadingHTTPServer
from examples.catalog_service import SnapshotStore, handler_for, accepts_gzip

ROOT = Path(__file__).resolve().parents[1]


class ServiceTests(unittest.TestCase):
    def test_snapshot_reuses_validated_data_and_surfaces_bad_replacement(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "snapshot.json"
            path.write_bytes((ROOT / "docs/data/catalog.json").read_bytes())
            s = SnapshotStore(path)
            a = s.snapshot()
            self.assertEqual(a, s.snapshot())
            path.write_text("{broken")
            b = s.snapshot()
            self.assertTrue(b[2])
            self.assertNotEqual(a[1], b[1])
            self.assertEqual(json.loads(b[0])["catalog"], json.loads(a[0])["catalog"])

    def test_first_load_failure_is_unavailable(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):
                SnapshotStore(Path(d) / "missing").snapshot()

    def test_encoding_quality_zero_is_not_gzip(self):
        self.assertTrue(accepts_gzip("br, gzip;q=0.5"))
        self.assertFalse(accepts_gzip("gzip;q=0"))
        self.assertFalse(accepts_gzip("gzip;q=bad"))

    def test_http_catalog_compression_revalidation_and_unknown_route(self):
        server = ThreadingHTTPServer(
            ("127.0.0.1", 0),
            handler_for(SnapshotStore(ROOT / "docs/data/catalog.json")),
        )
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f"http://127.0.0.1:{server.server_port}"
        try:
            with urllib.request.urlopen(base + "/api/catalog") as r:
                etag = r.headers["ETag"]
                self.assertEqual(len(json.load(r)["catalog"]["items"]), 24)
            with urllib.request.urlopen(
                urllib.request.Request(
                    base + "/api/catalog", headers={"Accept-Encoding": "gzip"}
                )
            ) as r:
                self.assertEqual(r.headers["Content-Encoding"], "gzip")
                self.assertEqual(
                    len(json.loads(gzip.decompress(r.read()))["catalog"]["items"]), 24
                )
            with self.assertRaises(urllib.error.HTTPError) as error:
                urllib.request.urlopen(
                    urllib.request.Request(
                        base + "/api/catalog", headers={"If-None-Match": etag}
                    )
                )
            self.assertEqual(error.exception.code, 304)
            with urllib.request.urlopen(base + "/readyz") as r:
                self.assertTrue(json.load(r)["validated_source"])
            with self.assertRaises(urllib.error.HTTPError) as error:
                urllib.request.urlopen(base + "/unknown")
            self.assertEqual(error.exception.code, 404)
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == "__main__":
    unittest.main()

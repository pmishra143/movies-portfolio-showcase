"""Validated, atomic fictional snapshot publication. Never contacts providers."""

import argparse, datetime, hashlib, json, os, tempfile
from pathlib import Path

PLATFORMS = {"Orbit Stream", "Lantern+", "Frame House"}


def validate(data):
    if (
        not isinstance(data, dict)
        or data.get("schemaVersion") != 1
        or data.get("demo") is not True
        or not isinstance(data.get("items"), list)
    ):
        raise ValueError("Invalid envelope")
    datetime.datetime.fromisoformat(data["generatedAt"].replace("Z", "+00:00"))
    ids = set()
    for item in data["items"]:
        ident = item["id"]
        if (
            not isinstance(ident, str)
            or len(ident) != 8
            or not ident.startswith("demo-")
            or not ident[5:].isdigit()
            or ident in ids
        ):
            raise ValueError("Invalid/duplicate identity")
        ids.add(ident)
        if (
            not isinstance(item.get("title"), str)
            or not item["title"].strip()
            or not isinstance(item.get("description"), str)
            or item.get("kind") not in {"movie", "series"}
            or item.get("language") not in {"English", "Hindi", "International"}
            or item.get("genre")
            not in {
                "Drama",
                "Thriller",
                "Adventure",
                "Animation",
                "Comedy",
                "Science fiction",
            }
            or not isinstance(item.get("kids"), bool)
        ):
            raise ValueError("Invalid metadata")
        for key, lo, hi in [
            ("rating", 0, 10),
            ("criticScore", 0, 100),
            ("year", 1900, 2100),
            ("runtime", 1, 10000),
            ("votes", 0, 10**12),
        ]:
            v = item.get(key)
            if (
                type(v) not in (int, float)
                or not lo <= v <= hi
                or (key in {"year", "runtime", "votes"} and type(v) != int)
            ):
                raise ValueError("Invalid measurement")
        datetime.date.fromisoformat(item["releaseDate"])
        if (
            not isinstance(item.get("platforms"), list)
            or not item["platforms"]
            or any(p not in PLATFORMS for p in item["platforms"])
        ):
            raise ValueError("Invalid platforms")
    return data


def publish(source, destination):
    data = validate(json.loads(Path(source).read_text()))
    body = (
        json.dumps(data, indent=2, ensure_ascii=False, allow_nan=False) + "\n"
    ).encode()
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Validation and serialization complete before creating/replacing the published file.
    fd, tmp = tempfile.mkstemp(prefix=".catalog-", dir=destination.parent)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(body)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, destination)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    return {
        "items": len(data["items"]),
        "sha256": hashlib.sha256(body).hexdigest(),
        "schemaVersion": 1,
        "demo": True,
    }


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("source")
    p.add_argument("destination")
    a = p.parse_args()
    print(json.dumps(publish(a.source, a.destination)))

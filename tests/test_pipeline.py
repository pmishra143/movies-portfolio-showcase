import copy, hashlib, json, tempfile, unittest
from pathlib import Path
from pipeline.build import publish, validate

ROOT = Path(__file__).resolve().parents[1]


class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / "docs/data/catalog.json").read_text())

    def test_snapshot_has_unique_valid_records(self):
        self.assertEqual(len(validate(self.data)["items"]), 24)

    def test_failed_validation_preserves_last_good_bytes(self):
        with tempfile.TemporaryDirectory() as d:
            source = Path(d) / "source.json"
            out = Path(d) / "published.json"
            out.write_text("last-good")
            self.data["items"][1]["id"] = self.data["items"][0]["id"]
            source.write_text(json.dumps(self.data))
            with self.assertRaises(ValueError):
                publish(source, out)
            self.assertEqual(out.read_text(), "last-good")

    def test_deterministic_build_and_checksum(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / "catalog.json"
            a = publish(ROOT / "docs/data/catalog.json", out)
            b = publish(ROOT / "docs/data/catalog.json", out)
            self.assertEqual(a, b)
            self.assertEqual(a["sha256"], hashlib.sha256(out.read_bytes()).hexdigest())

    def test_contract_rejects_nan_negative_votes_and_unknown_platform(self):
        for key, value in [
            ("rating", float("nan")),
            ("votes", -1),
            ("platforms", ["unknown"]),
        ]:
            with self.subTest(key=key):
                data = copy.deepcopy(self.data)
                data["items"][0][key] = value
                with self.assertRaises(ValueError):
                    validate(data)


if __name__ == "__main__":
    unittest.main()

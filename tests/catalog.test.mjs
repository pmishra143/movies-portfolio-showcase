import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  qualityScore,
  validateCatalog,
  queryCatalog,
  toggleSaved,
  readSaved,
  writeSaved,
  snapshotStatus,
} from "../docs/js/catalog.mjs";
const c = JSON.parse(
  fs.readFileSync(new URL("../docs/data/catalog.json", import.meta.url)),
);
test("contract accepts the fictional snapshot", () =>
  assert.equal(validateCatalog(c).items.length, 24));
test("contract rejects duplicate IDs", () => {
  const x = structuredClone(c);
  x.items.push(x.items[0]);
  assert.throws(() => validateCatalog(x));
});
test("contract rejects invalid measurements and platforms", () => {
  for (const [key, value] of [
    ["rating", NaN],
    ["votes", -1],
    ["platforms", ["Unknown"]],
  ]) {
    const x = structuredClone(c);
    x.items[0][key] = value;
    assert.throws(() => validateCatalog(x));
  }
});
test("quality blend uses capped confidence and critic fallback", () => {
  assert.equal(qualityScore({ rating: 8, votes: 0 }), 7.2);
  assert(
    Math.abs(
      qualityScore({ rating: 8, criticScore: 90, votes: 400000 }) - 7.75,
    ) < 1e-10,
  );
});
test("search is case-insensitive, normalized and token based", () =>
  assert.equal(
    queryCatalog(c.items, { search: "  OBSERVATORY!!! " })[0].title,
    "The Last Observatory",
  ));
test("filters combine without mutating the original population", () => {
  const before = JSON.stringify(c);
  const rows = queryCatalog(c.items, {
    tab: "movies",
    language: "Hindi",
    genre: "Drama",
  });
  assert.equal(rows.length, 2);
  assert(
    rows.every(
      (x) =>
        x.kind === "movie" && x.language === "Hindi" && x.genre === "Drama",
    ),
  );
  assert.equal(JSON.stringify(c), before);
});
test("kids view only includes the animation fixture cohort", () =>
  assert(queryCatalog(c.items, { tab: "kids" }).every((x) => x.kids)));
test("watchlist filters stable IDs and toggles without duplicates", () => {
  const ids = toggleSaved([], "demo-001");
  assert.deepEqual(
    queryCatalog(c.items, { tab: "saved", saved: ids }).map((x) => x.id),
    ids,
  );
  assert.deepEqual(toggleSaved(ids, "demo-001"), []);
});
test("unavailable or corrupt browser storage fails safely", () => {
  const store = {
    getItem() {
      throw Error("denied");
    },
    setItem() {
      throw Error("denied");
    },
  };
  assert.deepEqual(readSaved(store), []);
  assert.equal(writeSaved(store, []), false);
  assert.deepEqual(readSaved({ getItem: () => "{broken" }), []);
  assert.deepEqual(
    readSaved({
      getItem: () => JSON.stringify(["demo-001", "demo-001", "private-id"]),
    }),
    ["demo-001"],
  );
});
test("staleness distinguishes old, recent, future and invalid timestamps", () => {
  const now = Date.parse("2026-11-21T12:00:00Z");
  assert.equal(snapshotStatus("2026-11-20T12:00:00Z", now), "recent");
  assert.equal(snapshotStatus("2026-10-01", now), "stale");
  assert.equal(snapshotStatus("2027-01-01", now), "unknown");
  assert.equal(snapshotStatus("bad", now), "unknown");
});
test("newest sort is ordered and empty matches stay empty", () => {
  const rows = queryCatalog(c.items, { sort: "newest" });
  assert(rows.every((x, i) => !i || x.releaseDate <= rows[i - 1].releaseDate));
  assert.deepEqual(
    queryCatalog(c.items, { search: "no-such-title-99999" }),
    [],
  );
});

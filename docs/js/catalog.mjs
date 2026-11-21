/** Adapted from the owner's original qualityScore; see docs/PROVENANCE.md. */
export function qualityScore(item) {
  const rating = Number(item.rating || 0);
  const critic =
    item.criticScore != null ? Number(item.criticScore) / 10 : rating;
  const votes = Number(item.votes || 0);
  const voteBoost = Math.min(2, Math.sqrt(votes / 100000));
  return rating * 0.55 + critic * 0.35 + voteBoost * 0.1;
}
export function normalize(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function validateCatalog(value) {
  if (
    !value ||
    value.schemaVersion !== 1 ||
    value.demo !== true ||
    !Number.isFinite(Date.parse(value.generatedAt)) ||
    !Array.isArray(value.items)
  )
    throw Error("Invalid catalog envelope");
  const ids = new Set();
  for (const item of value.items) {
    if (!/^demo-\d{3}$/.test(item.id) || ids.has(item.id))
      throw Error("Invalid or duplicate item ID");
    ids.add(item.id);
    if (
      typeof item.title !== "string" ||
      !item.title.trim() ||
      typeof item.description !== "string" ||
      !["movie", "series"].includes(item.kind) ||
      !["English", "Hindi", "International"].includes(item.language) ||
      ![
        "Drama",
        "Thriller",
        "Adventure",
        "Animation",
        "Comedy",
        "Science fiction",
      ].includes(item.genre) ||
      typeof item.kids !== "boolean"
    )
      throw Error("Invalid item metadata");
    if (
      !Number.isInteger(item.year) ||
      item.year < 1900 ||
      item.year > 2100 ||
      !Number.isFinite(Date.parse(item.releaseDate)) ||
      !Number.isFinite(item.rating) ||
      item.rating < 0 ||
      item.rating > 10 ||
      !Number.isInteger(item.votes) ||
      item.votes < 0 ||
      !Number.isInteger(item.runtime) ||
      item.runtime <= 0 ||
      !Number.isFinite(item.criticScore) ||
      item.criticScore < 0 ||
      item.criticScore > 100
    )
      throw Error("Invalid item measurements");
    if (
      !Array.isArray(item.platforms) ||
      !item.platforms.length ||
      item.platforms.some(
        (x) => !["Orbit Stream", "Lantern+", "Frame House"].includes(x),
      )
    )
      throw Error("Invalid platforms");
  }
  return value;
}
export function queryCatalog(
  items,
  {
    tab = "week",
    search = "",
    language = "",
    genre = "",
    platform = "",
    sort = "quality",
    saved = [],
  } = {},
) {
  const tokens = normalize(search).split(" ").filter(Boolean),
    savedIds = new Set(saved);
  const filtered = items.filter(
    (it) =>
      (tab !== "movies" || it.kind === "movie") &&
      (tab !== "series" || it.kind === "series") &&
      (tab !== "kids" || it.kids) &&
      (tab !== "saved" || savedIds.has(it.id)) &&
      (!language || it.language === language) &&
      (!genre || it.genre === genre) &&
      (!platform || it.platforms.includes(platform)) &&
      tokens.every((t) =>
        normalize(it.title + " " + it.description + " " + it.genre).includes(t),
      ),
  );
  return filtered.slice().sort((a, b) => {
    const delta =
      sort === "newest"
        ? Date.parse(b.releaseDate) - Date.parse(a.releaseDate)
        : sort === "votes"
          ? b.votes - a.votes
          : qualityScore(b) - qualityScore(a);
    return delta || a.id.localeCompare(b.id);
  });
}
export function toggleSaved(ids, id) {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}
export function readSaved(storage) {
  try {
    const data = JSON.parse(storage.getItem("framefolio-demo-saved") || "[]");
    return Array.isArray(data)
      ? [
          ...new Set(
            data.filter((x) => typeof x === "string" && /^demo-\d{3}$/.test(x)),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
export function writeSaved(storage, ids) {
  try {
    storage.setItem("framefolio-demo-saved", JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
}
export function snapshotStatus(iso, now = Date.now()) {
  const age = now - Date.parse(iso);
  return !Number.isFinite(age) || age < 0
    ? "unknown"
    : age > 14 * 86400000
      ? "stale"
      : "recent";
}

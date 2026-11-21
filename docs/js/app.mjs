import {
  qualityScore,
  validateCatalog,
  queryCatalog,
  toggleSaved,
  readSaved,
  writeSaved,
  snapshotStatus,
} from "./catalog.mjs";
const $ = (id) => document.getElementById(id),
  e = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (ch) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[ch],
    );
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}
let catalog = null,
  tab = "week",
  saved = readSaved(storage),
  degraded = false,
  toastTimer,
  lastFocused;
const titles = {
  week: [
    "Make room for a good story.",
    "Explore the weekly edit, find something unexpected, and keep a shortlist.",
  ],
  movies: [
    "An evening, well chosen.",
    "Explore the fictional movie collection with transparent filters and rankings.",
  ],
  series: [
    "Find your next chapter.",
    "A compact series shelf. Sample runtimes are per episode.",
  ],
  kids: [
    "Big worlds. Small explorers.",
    "Original animation fixtures for the demonstration; not real age classifications.",
  ],
  discover: [
    "Follow your curiosity.",
    "Combine language, genre and platform filters, then inspect the details.",
  ],
  saved: [
    "A shortlist worth returning to.",
    "Saved only in this browser. No account, shared preferences or server writes.",
  ],
};
function toast(message) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("toast").hidden = true), 4000);
}
function image(it) {
  return "assets/" + it.id.slice(-3) + ".svg";
}
function saveButton(it) {
  return `<button class="save" data-save="${e(it.id)}" aria-pressed="${saved.includes(it.id)}" aria-label="${saved.includes(it.id) ? "Remove" : "Save"} ${e(it.title)} ${saved.includes(it.id) ? "from" : "to"} watchlist">${saved.includes(it.id) ? "✓ Saved" : "+ Watchlist"}</button>`;
}
function card(it) {
  return `<article class="card"><button class="poster-button" data-open="${e(it.id)}" aria-label="Open details for ${e(it.title)}"><img src="${image(it)}" alt="Original abstract demo artwork for ${e(it.title)}" loading="lazy" width="300" height="370"><span class="rating">★ ${it.rating.toFixed(1)}</span><span class="poster-caption">${e(it.genre.toUpperCase())} / ${it.kind === "series" ? "SERIES" : "FILM"}</span></button><h3>${e(it.title)}</h3><p class="metadata">${it.year} · ${e(it.language)} · ${it.runtime} min${it.kind === "series" ? "/ep" : ""}</p><div class="card-footer"><span class="platform">${it.platforms.map(e).join(" · ")}</span>${saveButton(it)}</div></article>`;
}
function heroes() {
  const movie = queryCatalog(
      catalog.items.filter((x) => x.kind === "movie"),
    )[0],
    series = queryCatalog(catalog.items.filter((x) => x.kind === "series"))[0];
  return `<div class="hero-grid">${[
    [movie, "FILM OF THE WEEK"],
    [series, "SERIES OF THE WEEK"],
  ]
    .map(
      ([it, label]) =>
        `<article class="hero"><img src="${image(it)}" alt="Demo artwork" width="130" height="190"><div><span class="eyebrow">${label}</span><h2>${e(it.title)}</h2><p class="muted">${e(it.language)} · ${e(it.genre)} · ${it.year}</p><p>★ ${it.rating.toFixed(1)} sample rating · ${it.votes.toLocaleString()} fictional votes</p><button class="primary" data-open="${it.id}">Explore this story ↗</button></div></article>`,
    )
    .join("")}</div>`;
}
function notices() {
  const historical = catalog && snapshotStatus(catalog.generatedAt) === "stale";
  $("service-notice").hidden = !degraded && !historical;
  if (degraded)
    $("service-notice").textContent =
      "Failure exercise: refresh failed. The last loaded demo snapshot remains available; no new provider data is claimed. Restore the demo state from Behind the build.";
  else if (historical)
    $("service-notice").textContent =
      "Historical demo snapshot: this fixture is more than 14 days old. Titles and availability are fictional and are not a current streaming guide.";
  $("recovery-status").textContent = degraded
    ? "Degraded demo state: the simulated refresh failed. Existing fixture retained, status visible, and no background retries or private calls were made."
    : "Normal demo state: the bundled snapshot is available. Its date is explicit; no live-provider health is claimed.";
  $("simulate-failure").hidden = degraded;
  $("recover").hidden = !degraded;
}
function insight() {
  const values = [
    ["Titles", catalog.items.length],
    ["Movies", catalog.items.filter((i) => i.kind === "movie").length],
    ["Series", catalog.items.filter((i) => i.kind === "series").length],
    ["Demo platforms", new Set(catalog.items.flatMap((i) => i.platforms)).size],
  ];
  $("insight-metrics").innerHTML = values
    .map(
      ([label, n]) =>
        `<div class="metric"><strong>${n}</strong><span>${label}</span></div>`,
    )
    .join("");
  for (const [field, id] of [
    ["language", "language-chart"],
    ["genre", "genre-chart"],
  ]) {
    const counts = new Map();
    for (const i of catalog.items)
      counts.set(i[field], (counts.get(i[field]) || 0) + 1);
    $("" + id).innerHTML = [...counts]
      .sort((a, b) => b[1] - a[1])
      .map(
        ([label, n]) =>
          `<div class="bar-row"><span>${e(label)}</span><div class="bar"><span style="width:${(100 * n) / catalog.items.length}%"></span></div><strong>${n}</strong></div>`,
      )
      .join("");
  }
}
function render() {
  document
    .querySelectorAll("[data-tab]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.tab === tab)),
    );
  $("collection").hidden = ["engineering", "analytics"].includes(tab);
  $("engineering").hidden = tab !== "engineering";
  $("insights").hidden = tab !== "analytics";
  $("saved-count").textContent = saved.length;
  if (!catalog) return;
  if (tab === "analytics") insight();
  notices();
  if (!titles[tab]) return;
  [$("view-title").textContent, $("view-description").textContent] =
    titles[tab];
  const items = queryCatalog(catalog.items, {
    tab,
    search: $("search").value,
    language: $("language").value,
    genre: $("genre").value,
    platform: $("platform").value,
    sort: $("sort").value,
    saved,
  });
  const filtered = ["search", "language", "genre", "platform"].some(
    (id) => $(id).value,
  );
  $("weekly-edit").hidden = tab !== "week" || filtered;
  $("weekly-edit").innerHTML = tab === "week" && !filtered ? heroes() : "";
  $("grid").innerHTML = items.map(card).join("");
  $("result-count").textContent =
    `${items.length} of ${catalog.items.length} fictional titles`;
  $("empty").hidden = items.length > 0;
  $("empty-message").textContent =
    tab === "saved" && !saved.length
      ? "Save a title from the collection to build your browser-local watchlist."
      : "Try another filter combination.";
}
function clear() {
  for (const id of ["search", "language", "genre", "platform"])
    $(id).value = "";
  $("sort").value = "quality";
  render();
}
function save(id) {
  saved = toggleSaved(saved, id);
  const persisted = writeSaved(storage, saved);
  render();
  if ($("detail").open) openDetails(id, false);
  toast(
    persisted
      ? saved.includes(id)
        ? "Saved to this browser’s watchlist."
        : "Removed from this browser’s watchlist."
      : "Browser storage is unavailable. This selection lasts for this page session only.",
  );
}
function openDetails(id, show = true) {
  const it = catalog?.items.find((i) => i.id === id);
  if (!it) return;
  if (show) lastFocused = document.activeElement;
  $("detail-content").innerHTML =
    `<div class="detail-layout"><img src="${image(it)}" alt="Original abstract demo artwork for ${e(it.title)}" width="300" height="440"><div><span class="eyebrow">${it.kind.toUpperCase()} / FICTIONAL DEMO</span><h2 id="detail-title">${e(it.title)}</h2><p class="muted">${it.year} · ${e(it.language)} · ${e(it.genre)} · ${it.runtime} minutes${it.kind === "series" ? " per episode" : ""}</p><p>${e(it.description)}</p><span class="detail-label">ILLUSTRATIVE SCORE</span><p>★ ${it.rating.toFixed(1)} / 10 · ${it.votes.toLocaleString()} sample votes<br>Quality blend: ${qualityScore(it).toFixed(2)} (ranking heuristic)</p><span class="detail-label">FICTIONAL AVAILABILITY</span><p>${it.platforms.map(e).join(" · ")}<br>Not real streaming offers; there is no playback or purchase.</p><div class="button-row">${saveButton(it)}<button data-share="${it.id}">Copy demo title link</button></div></div></div>`;
  if (show && !$("detail").open) $("detail").showModal();
}
$("close-detail").onclick = () => $("detail").close();
$("detail").addEventListener(
  "close",
  () => lastFocused?.isConnected && lastFocused.focus(),
);
$("detail").addEventListener("click", (ev) => {
  if (ev.target === $("detail")) {
    const r = $("detail").getBoundingClientRect();
    if (
      ev.clientX < r.left ||
      ev.clientX > r.right ||
      ev.clientY < r.top ||
      ev.clientY > r.bottom
    )
      $("detail").close();
  }
});
document.addEventListener("click", async (ev) => {
  const view = ev.target.closest("[data-tab]"),
    open = ev.target.closest("[data-open]"),
    saveEl = ev.target.closest("[data-save]"),
    share = ev.target.closest("[data-share]");
  if (view) {
    tab = view.dataset.tab;
    render();
  } else if (open) openDetails(open.dataset.open);
  else if (saveEl) save(saveEl.dataset.save);
  else if (share) {
    const url = new URL(location.href);
    url.hash = "title=" + share.dataset.share;
    try {
      await navigator.clipboard.writeText(url.href);
      toast("Demo title link copied.");
    } catch {
      toast("Copy this address: " + url.href);
    }
  }
});
$("filters").onsubmit = (ev) => ev.preventDefault();
for (const id of ["search", "language", "genre", "platform", "sort"])
  $(id).addEventListener(id === "search" ? "input" : "change", render);
$("clear").onclick = clear;
$("empty-reset").onclick = clear;
$("reset-demo").onclick = () => {
  saved = [];
  writeSaved(storage, []);
  render();
  if ($("detail").open) $("detail").close();
  toast("This browser’s demo selections were cleared.");
};
$("simulate-failure").onclick = () => {
  degraded = true;
  render();
};
$("recover").onclick = () => {
  degraded = false;
  render();
  toast("Normal demo state restored; the fixture has not changed.");
};
async function load() {
  catalog = null;
  $("loading").hidden = false;
  $("load-error").hidden = true;
  try {
    const response = await fetch("data/catalog.json", { cache: "no-cache" });
    if (!response.ok) throw Error("Catalog HTTP failure");
    catalog = validateCatalog(await response.json());
    saved = saved.filter((id) => catalog.items.some((it) => it.id === id));
    $("snapshot").textContent =
      "Demo snapshot · " +
      new Date(catalog.generatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
    render();
    const id = new URLSearchParams(location.hash.slice(1)).get("title");
    if (id) openDetails(id);
  } catch {
    $("load-error").hidden = false;
    $("snapshot").textContent = "Snapshot unavailable";
    $("grid").innerHTML = "";
    $("weekly-edit").hidden = true;
    $("result-count").textContent = "";
    $("empty").hidden = true;
  } finally {
    $("loading").hidden = true;
  }
}
$("retry-load").onclick = load;
load();

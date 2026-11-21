# Source provenance and honest scope

The owner’s local private project is called `watchlist-weekly`. It is a standalone working tree, not a verified `movies/` directory inside the PM Portals monorepo. No `git subtree` operation or private-history push was used.

## Inspected inputs

| Original source file | SHA-256 at inspection |
|---|---|
| `static/app.js` | `b11c539fff56abd8f37da7ce9c025bdc20963b68981e32e730e5a7ae062ec4c4` |
| `scripts/fetch_weekly.py` | `cd7595170a1e666aea0563c83be5c92fa607175d917b3865c30fd83afc26a49e` |
| `app.py` | `54c119c9d04761c01e44cddaa607354b6a9abd417a92c30e45fc56c4c75ef797` |

Only a narrow algorithm and workflow understanding were adapted; the full files above are not included in this repository.

## Exact adaptation

Original `static/app.js`, function `qualityScore`, lines 688–694 at inspection, combines IMDb audience rating, RT critic score or fallback, and a capped vote boost. `docs/js/catalog.mjs` preserves that formula while renaming the fixture fields to `rating`, `criticScore` and `votes`. Public values are entirely fictional and are not branded as provider ratings.

The original `fmtVotes`/search, filter and UI areas were inspected for context; the public components are newly implemented. Original `scripts/fetch_weekly.py` has source-discovery and filtering functions. Original `app.py` has catalog loading, file-version caching and compact/gzip serving. These observations inform the private-app description but do not establish live deployment state, uptime, data rights or external performance.

## What was newly written for the showcase

- Static navigation, title dialog, browser-local watchlist, filters, catalog insight views and original SVG artwork.
- Twenty-four fictional records and a deterministic generator.
- Python validated atomic publication example and JavaScript schema checks.
- A separate loopback-only API reference using the private app’s file-version/cache boundary as a design input; not a copy of its production handlers.
- Unit tests, browser checks, CI, documentation and the explicit local failure exercise.

## What was deliberately excluded

Original data, preferences, hidden/liked/seen items, family images, private credentials, provider exports, live AI connections, server authentication, production deployment scripts, private hostnames, infrastructure configuration, companion personal apps and all prior Git history.

A source-file hash is a provenance reference, not permission to distribute third-party material. This repo only distributes newly authored code/assets and the owner's adapted ranking formula. The public edition is not presented as the entire private app or as evidence of a production SLO.

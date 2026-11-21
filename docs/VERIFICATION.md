# Verification record

Initial release checked November 21, 2026.

- **11 Node tests:** contract validity, invalid/duplicate identity, invalid measurements/platforms, ranking arithmetic, normalized search, combined filters, immutable input, animation cohort, watchlist identity/toggling, corrupt/denied storage, freshness states, sorting and empty results.
- **8 Python tests:** deterministic validated publication and checksum, invalid-input preservation of last-good bytes, contract rejection, cached snapshot reuse, degraded replacement handling, cold-source failure, gzip negotiation, HTTP catalog/health boundaries, conditional304 and unknown route404.
- **Browser exercise:** eight navigable views;24 rendered fictional records;search and combined filters;title dialog;keyboard dismissal;watchlist persistence across reload;session-only behaviour with storage denied;first-load503 and retry;failed-refresh UI simulation;390px mobile layout with no page-level horizontal overflow;no page errors or unexpected third-party requests in the exercised workflows.
- **Visual review:** desktop1440px and mobile390px screenshots use only original fictional fixtures and SVG artwork.
- **Release review:** curated50-file tree, pattern-based audit, fresh Git history and local checksum/archive snapshot. This scan is a release aid, not a formal guarantee that every possible secret pattern is detectable.

Browser checks are separate from the lightweight Node/Python CI workflow. They require optional Playwright tooling and an installed Google Chrome. See the operating guide for reproduction.

These are correctness and workflow checks, not production load tests, an accessibility certification, a security penetration test or evidence of an availability SLO. The public catalog is a dated fixture; simulated failures are clearly labeled.

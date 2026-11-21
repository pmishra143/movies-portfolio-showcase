# Operating guide

## Release checklist

1. Run the Node and Python suites and `python3 tools/audit_public.py --history`.
2. Regenerate the fixture only when intentionally changing the sample content. Keep `demo: true`, stable IDs and an explicit snapshot date.
3. Run the snapshot builder to a temporary destination. Review its count and checksum, and inspect any schema changes in both validators.
4. Serve `docs/` locally and run `tools/verify-browser.cjs` with Playwright installed outside the release payload. Capture reviewed screenshots using fictional data only.
5. Review `git diff --cached` and the exact tracked-file list. Do not copy original source trees, data folders, environment files, infrastructure configurations, account cookies, personal artwork or old Git history.
6. Push to the standalone repository. GitHub Pages publishes `main:/docs`; CI must pass. Verify the live site in a signed-out browser, including its project-path asset URLs.
7. Retain the release commit and local audit checksums. Do not report deployment success until the public page and local JSON/JS assets can be fetched.

The browser driver expects Google Chrome to be installed. The initial browser validation used a separately installed Playwright package. To reproduce on another machine, install Playwright into a throwaway tooling directory and set `PLAYWRIGHT_MODULE` to its absolute package path, then serve `docs/` on loopback and run `node tools/verify-browser.cjs`. The live check accepts `DEMO_URL` to test a GitHub Pages project URL. The browser driver blocks third-party network requests.

## Rollback

For a faulty public release, revert the specific release commit in this standalone repo and push the resulting revert commit. Preserve newer changes rather than overwriting the branch or restoring an unrelated snapshot. Verify Pages after publication. The original private app is outside this release and needs no rollback.

For an invalid fixture proposal, do not publish it. The tested pipeline leaves the existing destination bytes intact when input validation fails. For a UI-only failure, a source revert restores the prior static files; it does not erase reviewers' browser-local saved selections.

## Data and privacy

There is no app login, cookies, analytics or tracking code. Static hosting may maintain its normal infrastructure logs. Saved IDs belong only to this demo's browser origin and can be cleared using the footer control. There are no API keys, real watchlists, client data, personal photographs, exported messages or private infrastructure addresses.

The date is intentionally a fixture date. Once more than 14 days old, the page describes it as historical sample content. Do not regenerate timestamps merely to imply current provider data.

## Support questions to demonstrate

- How do you distinguish availability, freshness and data correctness?
- How does a malformed snapshot affect first load versus publication over a known-good file?
- What does the checksum prove, and what does it not prove?
- How does the UI behave when local storage is blocked?
- Why is a successful transfer or HTTP response insufficient to establish a correct catalog?

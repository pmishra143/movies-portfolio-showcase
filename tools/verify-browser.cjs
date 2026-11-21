/* Optional Playwright driver. Keep the package in a separate tooling directory. */
const fs = require("fs"),
  assert = require("assert");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const target = process.env.DEMO_URL || "http://127.0.0.1:8769/";
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
  });
  const page = await context.newPage(),
    errors = [],
    unexpected = [];
  page.on("pageerror", (x) => errors.push(x.message));
  await context.route("**/*", (route) => {
    const url = route.request().url();
    if (!url.startsWith(target)) {
      unexpected.push(url);
      return route.abort();
    }
    return route.continue();
  });
  await page.goto(target);
  await page.locator(".card").first().waitFor();
  assert.equal(await page.locator(".card").count(), 24);
  assert(await page.locator("#weekly-edit").isVisible());
  for (const tab of [
    "movies",
    "series",
    "kids",
    "discover",
    "saved",
    "analytics",
    "engineering",
    "week",
  ]) {
    await page.locator(`[data-tab="${tab}"]`).click();
    if (tab === "engineering")
      assert(await page.locator("#engineering").isVisible());
    else if (tab === "analytics")
      assert.equal(await page.locator(".metric").count(), 4);
    else assert(await page.locator("#collection").isVisible());
  }
  await page.locator('[data-tab="discover"]').click();
  await page.locator("#search").fill("MONSOON!!");
  assert.equal(await page.locator(".card").count(), 1);
  await page.locator(".card [data-open]").click();
  assert(await page.locator("#detail").isVisible());
  assert.equal(
    await page.locator("#detail-title").innerText(),
    "Monsoon Letters",
  );
  await page.locator("#detail [data-save]").click();
  await page.locator("#close-detail").click();
  await page.locator('[data-tab="saved"]').click();
  assert.equal(await page.locator(".card").count(), 1);
  await page.reload();
  await page.locator(".card").first().waitFor();
  await page.locator('[data-tab="saved"]').click();
  assert.equal(await page.locator(".card").count(), 1);
  await page.locator(".card [data-save]").click();
  assert(await page.locator("#empty").isVisible());
  await page.locator('[data-tab="discover"]').click();
  await page.locator("#language").selectOption("Hindi");
  await page.locator("#genre").selectOption("Drama");
  await page.locator('[data-tab="movies"]').click();
  assert.equal(await page.locator(".card").count(), 2);
  await page.locator("#clear").click();
  await page.locator("#search").fill("not-a-title-99999");
  assert(await page.locator("#empty").isVisible());
  await page.locator("#empty-reset").click();
  await page.locator('[data-tab="engineering"]').click();
  await page.locator("#simulate-failure").click();
  assert(
    (await page.locator("#recovery-status").innerText()).includes("Degraded"),
  );
  await page.locator('[data-tab="week"]').click();
  assert(await page.locator("#service-notice").isVisible());
  assert.equal(await page.locator(".card").count(), 24);
  await page.locator('[data-tab="engineering"]').click();
  await page.locator("#recover").click();
  await page.locator('[data-tab="week"]').click();
  await page.locator("#reset-demo").click();
  await page.waitForTimeout(4100);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "docs/assets/demo-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const tab of [
    "week",
    "movies",
    "series",
    "kids",
    "discover",
    "saved",
    "analytics",
    "engineering",
  ]) {
    await page.locator(`[data-tab="${tab}"]`).click();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      tab + " horizontal overflow",
    );
  }
  await page.locator('[data-tab="week"]').click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "docs/assets/demo-mobile.png" });
  await page.locator(".card [data-open]").first().click();
  await page.keyboard.press("Escape");
  assert(!(await page.locator("#detail").isVisible()));
  // New context: persistent storage denied, selection must still work for this session.
  const denied = await browser.newContext();
  await denied.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw Error("blocked storage");
      },
    }),
  );
  const p2 = await denied.newPage();
  p2.on("pageerror", (x) => errors.push(x.message));
  await p2.goto(target);
  await p2.locator(".card").first().waitFor();
  await p2.locator(".card [data-save]").first().click();
  await p2.locator('[data-tab="saved"]').click();
  assert.equal(await p2.locator(".card").count(), 1);
  assert((await p2.locator("#toast").innerText()).includes("session only"));
  // First-load network failure must be explicit, not a fake successful empty catalog.
  const failed = await context.newPage();
  await failed.route("**/data/catalog.json", (r) =>
    r.fulfill({ status: 503, body: "unavailable" }),
  );
  await failed.goto(target);
  assert(await failed.locator("#load-error").isVisible());
  await failed.unroute("**/data/catalog.json");
  await failed.locator("#retry-load").click();
  await failed.locator(".card").first().waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(unexpected, []);
  await browser.close();
  console.log(
    JSON.stringify({
      navigationViews: 8,
      catalogRecords: 24,
      searchAndCombinedFilters: true,
      dialogAndKeyboard: true,
      watchlistPersistence: true,
      storageDeniedFallback: true,
      failedLoadAndRetry: true,
      refreshSimulation: true,
      mobileNoOverflow: true,
      unexpectedNetworkRequests: unexpected,
      pageErrors: errors,
    }),
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

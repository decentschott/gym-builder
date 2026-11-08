// End-to-end smoke tests: every drill opens and animates, plans build, templates load, print view renders.
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  await page.goto("/");
});
test.afterEach(async ({ page }) => {
  expect(page.errors, "no JavaScript errors").toEqual([]);
});

test("every drill opens and steps through its diagram", async ({ page }) => {
  await page.locator(".switch").click(); // show all drills, not just ones that fit the gym
  const ids = await page.locator(".card").evaluateAll((els) => els.map((e) => e.dataset.id));
  expect(ids.length).toBeGreaterThan(100);
  for (const id of ids) {
    await page.locator(`.card[data-id="${id}"] .cname`).click();
    await expect(page.locator("#stage svg")).toBeVisible();
    const steps = await page.locator("#pdots button").count();
    for (let i = 0; i < steps; i++) await page.locator("#pnext").click();
    await page.locator(".close").click();
  }
});

test("gym settings filter the catalog", async ({ page }) => {
  const before = await page.locator(".card").count();
  await page.locator("#gymBtn").click();
  await page.locator('.seg[data-k="space"] button[data-v="half"]').click();
  await page.locator("#gdone").click();
  const after = await page.locator(".card").count();
  expect(after).toBeLessThan(before);
  await expect(page.locator("#gymSum")).toContainText("Half court");
});

test("builds a practice plan that fills the time", async ({ page }) => {
  await page.locator('nav button[data-tab="plan"]').click();
  await page.locator('#len button[data-v="90"]').click();
  await page.locator('[data-focus="mot"]').click();
  await page.locator("#gen").click();
  await expect(page.locator(".block").first()).toBeVisible();
  await expect(page.locator(".psum b")).toHaveText("90 min");
  await page.locator("[data-sw]").first().click();
  await page.locator("#pprint").click();
  await expect(page.locator("#print .pdrill").first()).toBeVisible();
});

test("St. Luke template loads", async ({ page }) => {
  await page.locator('nav button[data-tab="plan"]').click();
  await page.locator('[data-tpl="0"]').click();
  await expect(page.locator(".pname")).toHaveValue(/St\. Luke/);
  await expect(page.locator(".psum b")).toHaveText("90 min");
});

test("plan shows time ranges, real clock times, and the end time", async ({ page }) => {
  await page.locator('nav button[data-tab="plan"]').click();
  await page.locator('[data-tpl="0"]').click();
  // St. Luke template starts at 3:30 → ends 5:00 PM (not "1:00")
  await expect(page.locator(".psum")).toContainText("3:30 PM – 5:00 PM");
  await expect(page.locator(".block").last().locator(".bt")).toHaveText("4:30–5:00");
  await expect(page.locator(".bend")).toContainText("5:00 PM");
  // Clearing the start time falls back to elapsed time
  await page.locator("#pclear").click();
  await expect(page.locator(".block").last().locator(".bt")).toHaveText("1:00–1:30");
  await expect(page.locator(".psum")).toContainText("ends at 1:30");
});

test("drag and drop reorders practice blocks", async ({ page }, testInfo) => {
  await page.locator('nav button[data-tab="plan"]').click();
  await page.locator('[data-tpl="0"]').click();
  const names = () => page.locator(".block .bname").allTextContents();
  const before = await names();
  // drag the first block's handle down past the third block (real touch on phone, mouse on tablet)
  await page.locator(".block").nth(1).scrollIntoViewIfNeeded();
  const grip = page.locator('.grip[data-drag="0"]');
  const target = page.locator(".block").nth(2);
  const g = await grip.boundingBox(), t = await target.boundingBox();
  const x = g.x + g.width / 2, y0 = g.y + g.height / 2, y1 = t.y + t.height * 0.75;
  if (testInfo.project.name === "phone") {
    const cdp = await page.context().newCDPSession(page);
    const touch = (type, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
    await touch("touchStart", y0);
    for (let i = 1; i <= 10; i++) await touch("touchMove", y0 + (y1 - y0) * (i / 10));
    await touch("touchEnd", y1);
  } else {
    await page.mouse.move(x, y0);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(x, y0 + (y1 - y0) * (i / 10));
    await page.mouse.up();
  }
  const after = await names();
  expect(after[2]).toBe(before[0]);
  expect(after.slice(0, 2)).toEqual(before.slice(1, 3));
  // times recalculate from the new order
  await expect(page.locator(".block").first().locator(".bt")).toHaveText("3:30–3:40");
  // keyboard: arrow up moves it back
  await page.locator('.grip[data-drag="2"]').focus();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  expect(await names()).toEqual(before);
});

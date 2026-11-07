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

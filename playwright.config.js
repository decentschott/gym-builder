// @ts-check
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.js",
  timeout: 120000,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5173",
    // Use a locally installed Chrome if CHROME_PATH is set; otherwise Playwright's bundled Chromium.
    launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
  },
  webServer: { command: "node scripts/serve.js", url: "http://localhost:5173", reuseExistingServer: !process.env.CI },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], browserName: "chromium" } },
    { name: "tablet", use: { viewport: { width: 1024, height: 1366 }, browserName: "chromium" } },
  ],
});

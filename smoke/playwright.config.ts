import { defineConfig, devices } from "@playwright/test";

const PREVIEW_URL = process.env.PREVIEW_URL || "http://localhost:4173";

export default defineConfig({
  testDir: ".",
  timeout: 30000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1,
  reporter: [["html", { outputFolder: "../playwright-report-smoke" }]],
  use: {
    baseURL: PREVIEW_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalTimeout: process.env.CI ? 300000 : undefined,
  timeout: 10000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npx vite build --config vite.config.e2e.ts && npx vite preview",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});

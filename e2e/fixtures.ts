import { test as base, type Page } from "@playwright/test";

// Extend base test with authenticated page fixture
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    const password = process.env.TEST_ADMIN_PASSWORD;
    if (!password) {
      throw new Error("TEST_ADMIN_PASSWORD env var required for auth tests");
    }

    // Navigate to admin and login
    await page.goto("/admin");
    await page.getByPlaceholder(/password/i).fill(password);
    await page.getByRole("button", { name: /login|sign in/i }).click();

    // Wait for auth to complete
    await page.waitForSelector('[data-testid="admin-dashboard"]', {
      timeout: 10000,
    });

    await use(page);
  },
});

export { expect } from "@playwright/test";

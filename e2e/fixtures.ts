import { test as base, type Page } from "@playwright/test";

// E2E tests use "test-password" for mock auth
const TEST_PASSWORD = "test-password";

// Extend base test with authenticated page fixture
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to admin and login with test password
    await page.goto("/admin");
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /login|sign in/i }).click();

    // Wait for auth to complete
    await page.waitForSelector('[data-testid="admin-dashboard"]', {
      timeout: 10000,
    });

    await use(page);
  },
});

export { expect } from "@playwright/test";

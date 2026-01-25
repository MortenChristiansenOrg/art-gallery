import { test, expect } from "@playwright/test";
import { AdminPage } from "./pages";

// E2E tests use "test-password" for mock auth
const TEST_PASSWORD = "test-password";

test.describe("Authentication", () => {
  test.describe("login", () => {
    test("shows login form on admin page", async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.goto();

      await expect(adminPage.passwordInput).toBeVisible();
      await expect(adminPage.loginButton).toBeVisible();
    });

    test("logs in with valid password", async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.goto();
      await adminPage.login(TEST_PASSWORD);

      await expect(adminPage.dashboard).toBeVisible();
    });

    test("shows error with invalid password", async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.goto();

      await adminPage.passwordInput.fill("wrong-password");
      await adminPage.loginButton.click();

      // Should still see login form
      await expect(adminPage.passwordInput).toBeVisible();
    });
  });

  test.describe("logout", () => {
    test("logs out successfully", async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.goto();
      await adminPage.login(TEST_PASSWORD);

      await expect(adminPage.dashboard).toBeVisible();

      await adminPage.logout();
      await expect(adminPage.loginForm).toBeVisible();
    });
  });

  test.describe("protected routes", () => {
    test("admin page shows login when not authenticated", async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.goto();

      await expect(adminPage.passwordInput).toBeVisible();
    });
  });
});

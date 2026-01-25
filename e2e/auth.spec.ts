import { test, expect } from "@playwright/test";
import { AdminPage } from "./pages";

test.describe("Authentication", () => {
  test.describe("login", () => {
    test("shows login form on admin page", async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.goto();

      await expect(adminPage.passwordInput).toBeVisible();
      await expect(adminPage.loginButton).toBeVisible();
    });

    test("logs in with valid password", async ({ page }) => {
      const password = process.env.TEST_ADMIN_PASSWORD;
      test.skip(!password, "TEST_ADMIN_PASSWORD not set");

      const adminPage = new AdminPage(page);
      await adminPage.goto();
      await adminPage.login(password!);

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
      const password = process.env.TEST_ADMIN_PASSWORD;
      test.skip(!password, "TEST_ADMIN_PASSWORD not set");

      const adminPage = new AdminPage(page);
      await adminPage.goto();
      await adminPage.login(password!);

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

import { test, expect } from "@playwright/test";

/**
 * Critical path smoke tests for production verification.
 * These tests validate core functionality against a real backend.
 */

test.describe("Critical Paths", () => {
  test("1. Home page loads collections", async ({ page }) => {
    await page.goto("/");

    // Wait for collections grid to appear
    await expect(page.locator('[data-testid="collections-grid"]')).toBeVisible({
      timeout: 10000,
    });

    // Or check for hero content
    await expect(page.getByText(/curated space/i)).toBeVisible();
  });

  test("2. Collection navigation works", async ({ page }) => {
    await page.goto("/");

    // Wait for page load
    await page.waitForLoadState("networkidle");

    // Find and click first collection
    const collection = page.locator('[data-testid="collection-card"]').first();
    await expect(collection).toBeVisible();
    await collection.click();
    await expect(page).toHaveURL(/\/collection\//);
  });

  test("3. Artwork detail displays", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to collection
    const collection = page.locator('[data-testid="collection-card"]').first();
    await expect(collection).toBeVisible();
    await collection.click();
    await page.waitForLoadState("networkidle");

    // Click artwork
    const artwork = page.locator('[data-testid="artwork-card"]').first();
    await expect(artwork).toBeVisible();
    await artwork.click();
    await expect(page).toHaveURL(/\/artwork\//);
  });

  test("4. Image viewer opens/closes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to artwork
    const collection = page.locator('[data-testid="collection-card"]').first();
    await expect(collection).toBeVisible();
    await collection.click();
    await page.waitForLoadState("networkidle");

    const artwork = page.locator('[data-testid="artwork-card"]').first();
    await expect(artwork).toBeVisible();
    await artwork.click();
    await page.waitForLoadState("networkidle");

    // Open viewer
    const imageButton = page.getByRole("button", {
      name: /view artwork|enlarge/i,
    });
    await expect(imageButton).toBeVisible();
    await imageButton.click();

    // Check viewer is open
    const viewer = page.locator('[data-testid="image-viewer"]');
    await expect(viewer).toBeVisible();

    // Close viewer
    await page.keyboard.press("Escape");
    await expect(viewer).not.toBeVisible();
  });

  test("5. About page content loads", async ({ page }) => {
    await page.goto("/about");

    await expect(page.getByRole("heading", { name: "About" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /get in touch/i })).toBeVisible();
  });

  test("6. Contact form submits", async ({ page }) => {
    await page.goto("/about");

    // Fill form
    await page.getByPlaceholder("Your name").fill("Smoke Test");
    await page.getByPlaceholder("your@email.com").fill("smoke@test.com");
    await page.getByPlaceholder("Your message...").fill("Automated smoke test message");

    // Submit
    await page.getByRole("button", { name: /send message/i }).click();

    // Wait for success
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10000 });
  });

  test("7. Admin login works", async ({ page }) => {
    const password = process.env.TEST_ADMIN_PASSWORD;
    test.skip(!password, "TEST_ADMIN_PASSWORD not set");

    await page.goto("/admin");

    await page.getByPlaceholder(/password/i).fill(password!);
    await page.getByRole("button", { name: /login|sign in/i }).click();

    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test("8. Admin create artwork flow", async ({ page }) => {
    const password = process.env.TEST_ADMIN_PASSWORD;
    test.skip(!password, "TEST_ADMIN_PASSWORD not set");

    await page.goto("/admin");
    await page.getByPlaceholder(/password/i).fill(password!);
    await page.getByRole("button", { name: /login|sign in/i }).click();

    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();

    // Navigate to artworks tab and check add button exists
    await page.getByRole("tab", { name: /artworks/i }).click();
    await expect(page.getByRole("button", { name: /add|create|new/i })).toBeVisible();
  });

  test("9. Admin edit artwork flow", async ({ page }) => {
    const password = process.env.TEST_ADMIN_PASSWORD;
    test.skip(!password, "TEST_ADMIN_PASSWORD not set");

    await page.goto("/admin");
    await page.getByPlaceholder(/password/i).fill(password!);
    await page.getByRole("button", { name: /login|sign in/i }).click();

    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();

    // Navigate to artworks and verify list is visible
    await page.getByRole("tab", { name: /artworks/i }).click();
    await expect(page.locator('[data-testid="artworks-list"]')).toBeVisible();
  });

  test("10. Admin tabs work", async ({ page }) => {
    const password = process.env.TEST_ADMIN_PASSWORD;
    test.skip(!password, "TEST_ADMIN_PASSWORD not set");

    await page.goto("/admin");
    await page.getByPlaceholder(/password/i).fill(password!);
    await page.getByRole("button", { name: /login|sign in/i }).click();

    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();

    // Test all tabs
    await page.getByRole("tab", { name: /collections/i }).click();
    await expect(page.locator('[data-testid="collections-list"]')).toBeVisible();

    await page.getByRole("tab", { name: /messages/i }).click();
    await expect(page.locator('[data-testid="messages-list"]')).toBeVisible();

    await page.getByRole("tab", { name: /content/i }).click();
    await expect(page.getByText(/about|content/i)).toBeVisible();
  });
});

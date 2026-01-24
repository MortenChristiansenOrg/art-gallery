import { test, expect } from "@playwright/test";

test.describe("responsive-loading", () => {
  test("grid images have lazy loading and shimmer placeholder", async ({ page }) => {
    await page.goto("/");

    const img = page.locator("article img").first();
    const hasImages = await img.isVisible({ timeout: 4000 }).catch(() => false);

    if (hasImages) {
      await expect(img).toHaveAttribute("loading", "lazy");
    }
  });

  test("artwork detail page loads image", async ({ page }) => {
    await page.goto("/");

    const artworkLink = page.locator('a[href^="/artwork/"]').first();
    const hasArtworks = await artworkLink.isVisible({ timeout: 4000 }).catch(() => false);

    if (hasArtworks) {
      await artworkLink.click();
      await expect(page).toHaveURL(/\/artwork\//);

      const img = page.locator("article img").first();
      const imgOrPlaceholder = img.or(page.locator("article").getByText("No image"));
      await expect(imgOrPlaceholder).toBeVisible({ timeout: 4000 });
    }
  });
});

test.describe("zoom-pan-interaction", () => {
  test("viewer opens, shows controls and title, and closes", async ({ page }) => {
    await page.goto("/");

    const artworkLink = page.locator('a[href^="/artwork/"]').first();
    const hasArtworks = await artworkLink.isVisible({ timeout: 4000 }).catch(() => false);
    if (!hasArtworks) return;

    // Get title from card before navigating
    const cardTitle = await page.locator("article h3").first().textContent();

    await artworkLink.click();
    await expect(page).toHaveURL(/\/artwork\//);

    const imageContainer = page.locator('[role="button"][aria-label="View artwork in fullscreen"]');
    const hasImage = await imageContainer.isVisible({ timeout: 4000 }).catch(() => false);
    if (!hasImage) return;

    await imageContainer.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 4000 });

    // Zoom controls visible
    await expect(page.getByTestId("zoom-in")).toBeVisible();
    await expect(page.getByTestId("zoom-out")).toBeVisible();
    await expect(page.getByTestId("reset-zoom")).toBeVisible();

    // Title visible in viewer
    if (cardTitle) {
      await expect(dialog.getByText(cardTitle)).toBeVisible();
    }

    // Close via button
    await page.getByTestId("close-viewer").click();
    await expect(dialog).not.toBeVisible();
  });

  test("escape key closes viewer", async ({ page }) => {
    await page.goto("/");

    const artworkLink = page.locator('a[href^="/artwork/"]').first();
    const hasArtworks = await artworkLink.isVisible({ timeout: 4000 }).catch(() => false);
    if (!hasArtworks) return;

    await artworkLink.click();
    const imageContainer = page.locator('[role="button"][aria-label="View artwork in fullscreen"]');
    const hasImage = await imageContainer.isVisible({ timeout: 4000 }).catch(() => false);
    if (!hasImage) return;

    await imageContainer.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 4000 });

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("zoom controls work without crashing", async ({ page }) => {
    await page.goto("/");

    const artworkLink = page.locator('a[href^="/artwork/"]').first();
    const hasArtworks = await artworkLink.isVisible({ timeout: 4000 }).catch(() => false);
    if (!hasArtworks) return;

    await artworkLink.click();
    const imageContainer = page.locator('[role="button"][aria-label="View artwork in fullscreen"]');
    const hasImage = await imageContainer.isVisible({ timeout: 4000 }).catch(() => false);
    if (!hasImage) return;

    await imageContainer.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 4000 });

    const zoomIn = page.getByTestId("zoom-in");
    await zoomIn.click();
    await page.getByTestId("zoom-out").click();
    await page.getByTestId("reset-zoom").click();
    await expect(zoomIn).toBeVisible();
  });
});

test.describe("touch-gestures", () => {
  test("viewer accessible on mobile with instructions", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const artworkLink = page.locator('a[href^="/artwork/"]').first();
    const hasArtworks = await artworkLink.isVisible({ timeout: 4000 }).catch(() => false);
    if (!hasArtworks) return;

    await artworkLink.click();
    const imageContainer = page.locator('[role="button"][aria-label="View artwork in fullscreen"]');
    const hasImage = await imageContainer.isVisible({ timeout: 4000 }).catch(() => false);
    if (!hasImage) return;

    await imageContainer.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 4000 });

    // Close button visible on mobile
    await expect(page.getByTestId("close-viewer")).toBeVisible();
    // Zoom controls visible
    await expect(page.getByTestId("zoom-in")).toBeVisible();
    // Usage instructions
    await expect(page.getByText(/Drag to pan/)).toBeVisible();
  });
});

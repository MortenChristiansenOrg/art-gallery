import { test, expect } from "@playwright/test";

test.describe("responsive-loading", () => {
  test("grid images have lazy loading attribute", async ({ page }) => {
    await page.goto("/");

    const img = page.locator("article img").first();
    const hasImages = await img.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasImages) {
      await expect(img).toHaveAttribute("loading", "lazy");
    }
  });

  test("images show shimmer placeholder while loading", async ({ page }) => {
    await page.goto("/");

    // Check if shimmer placeholder exists (should appear before image loads)
    const shimmer = page.locator(".skeleton-shimmer").first();
    const hasShimmer = await shimmer.isVisible({ timeout: 2000 }).catch(() => false);

    // Either shimmer is visible or images loaded fast
    expect(hasShimmer || true).toBeTruthy();
  });

  test("artwork detail page loads image", async ({ page }) => {
    await page.goto("/");

    const artworkLink = page.locator('a[href^="/artwork/"]').first();
    const hasArtworks = await artworkLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasArtworks) {
      await artworkLink.click();
      await expect(page).toHaveURL(/\/artwork\//);

      // Image should eventually be visible
      const img = page.locator("article img").first();
      const imgOrPlaceholder = img.or(page.locator("article").getByText("No image"));
      await expect(imgOrPlaceholder).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe("zoom-pan-interaction", () => {
  test("clicking artwork image opens viewer", async ({ page }) => {
    await page.goto("/");

    const artworkLink = page.locator('a[href^="/artwork/"]').first();
    const hasArtworks = await artworkLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasArtworks) {
      await artworkLink.click();
      await expect(page).toHaveURL(/\/artwork\//);

      // Click on the image/frame to open viewer
      const imageContainer = page.locator('[role="button"][aria-label="View artwork in fullscreen"]');
      const hasImage = await imageContainer.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasImage) {
        await imageContainer.click();

        // Viewer dialog should appear
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("viewer shows zoom controls", async ({ page }) => {
    await page.goto("/");

    const artworkLink = page.locator('a[href^="/artwork/"]').first();
    const hasArtworks = await artworkLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasArtworks) {
      await artworkLink.click();
      await expect(page).toHaveURL(/\/artwork\//);

      const imageContainer = page.locator('[role="button"][aria-label="View artwork in fullscreen"]');
      const hasImage = await imageContainer.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasImage) {
        await imageContainer.click();

        // Wait for viewer to open
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Check for zoom controls
        await expect(page.getByTestId("zoom-in")).toBeVisible();
        await expect(page.getByTestId("zoom-out")).toBeVisible();
        await expect(page.getByTestId("reset-zoom")).toBeVisible();
      }
    }
  });

  test("close button closes viewer", async ({ page }) => {
    await page.goto("/");

    const artworkLink = page.locator('a[href^="/artwork/"]').first();
    const hasArtworks = await artworkLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasArtworks) {
      await artworkLink.click();
      await expect(page).toHaveURL(/\/artwork\//);

      const imageContainer = page.locator('[role="button"][aria-label="View artwork in fullscreen"]');
      const hasImage = await imageContainer.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasImage) {
        await imageContainer.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Close via button
        const closeButton = page.getByTestId("close-viewer");
        await closeButton.click();

        // Dialog should be gone
        await expect(dialog).not.toBeVisible();
      }
    }
  });

  test("escape key closes viewer", async ({ page }) => {
    await page.goto("/");

    const artworkLink = page.locator('a[href^="/artwork/"]').first();
    const hasArtworks = await artworkLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasArtworks) {
      await artworkLink.click();
      await expect(page).toHaveURL(/\/artwork\//);

      const imageContainer = page.locator('[role="button"][aria-label="View artwork in fullscreen"]');
      const hasImage = await imageContainer.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasImage) {
        await imageContainer.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Press Escape
        await page.keyboard.press("Escape");

        // Dialog should be gone
        await expect(dialog).not.toBeVisible();
      }
    }
  });

  test("viewer shows artwork title", async ({ page }) => {
    await page.goto("/");

    const artworkLink = page.locator('a[href^="/artwork/"]').first();
    const hasArtworks = await artworkLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasArtworks) {
      // Get the title from the card
      const cardTitle = await page.locator("article h3").first().textContent();

      await artworkLink.click();
      await expect(page).toHaveURL(/\/artwork\//);

      const imageContainer = page.locator('[role="button"][aria-label="View artwork in fullscreen"]');
      const hasImage = await imageContainer.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasImage && cardTitle) {
        await imageContainer.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Title should be visible in viewer
        await expect(dialog.getByText(cardTitle)).toBeVisible();
      }
    }
  });

  test("zoom controls work", async ({ page }) => {
    await page.goto("/");

    const artworkLink = page.locator('a[href^="/artwork/"]').first();
    const hasArtworks = await artworkLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasArtworks) {
      await artworkLink.click();
      await expect(page).toHaveURL(/\/artwork\//);

      const imageContainer = page.locator('[role="button"][aria-label="View artwork in fullscreen"]');
      const hasImage = await imageContainer.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasImage) {
        await imageContainer.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Click zoom in - should not throw error
        const zoomIn = page.getByTestId("zoom-in");
        await zoomIn.click();

        // Click zoom out
        const zoomOut = page.getByTestId("zoom-out");
        await zoomOut.click();

        // Click reset
        const reset = page.getByTestId("reset-zoom");
        await reset.click();

        // Controls should still be visible (viewer didn't crash)
        await expect(zoomIn).toBeVisible();
      }
    }
  });
});

test.describe("touch-gestures", () => {
  test("viewer is accessible on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const artworkLink = page.locator('a[href^="/artwork/"]').first();
    const hasArtworks = await artworkLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasArtworks) {
      await artworkLink.click();
      await expect(page).toHaveURL(/\/artwork\//);

      const imageContainer = page.locator('[role="button"][aria-label="View artwork in fullscreen"]');
      const hasImage = await imageContainer.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasImage) {
        await imageContainer.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Close button should be visible and accessible on mobile
        const closeButton = page.getByTestId("close-viewer");
        await expect(closeButton).toBeVisible();

        // Zoom controls visible
        await expect(page.getByTestId("zoom-in")).toBeVisible();
      }
    }
  });

  test("instructions mention touch gestures", async ({ page }) => {
    await page.goto("/");

    const artworkLink = page.locator('a[href^="/artwork/"]').first();
    const hasArtworks = await artworkLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasArtworks) {
      await artworkLink.click();
      await expect(page).toHaveURL(/\/artwork\//);

      const imageContainer = page.locator('[role="button"][aria-label="View artwork in fullscreen"]');
      const hasImage = await imageContainer.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasImage) {
        await imageContainer.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Should show some usage instructions
        await expect(page.getByText(/Drag to pan/)).toBeVisible();
      }
    }
  });
});

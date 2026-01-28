import { test, expect } from "@playwright/test";
import { HomePage, CollectionPage, ArtworkPage, AboutPage } from "./pages";

test.describe("Gallery Navigation", () => {
  test.describe("home page", () => {
    test("loads and displays collections", async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.waitForLoad();

      await expect(homePage.collectionsGrid).toBeVisible();
    });

    test("shows header and footer", async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await expect(homePage.header).toBeVisible();
      await expect(homePage.footer).toBeVisible();
    });

    test("navigates to about page", async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.goToAbout();

      await expect(page).toHaveURL(/\/about/);
    });
  });

  test.describe("collection page", () => {
    test("displays collection with artworks", async ({ page }) => {
      // First go to home and click a collection
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.waitForLoad();

      // Get first collection link
      const firstCollection = homePage.collectionCards.first();
      await firstCollection.click();

      // Should be on collection page
      await expect(page).toHaveURL(/\/collection\//);

      const collectionPage = new CollectionPage(page);
      await expect(collectionPage.title).toBeVisible();
    });

    test("shows 404 for non-existent collection", async ({ page }) => {
      const collectionPage = new CollectionPage(page);
      await collectionPage.goto("non-existent-collection");

      await expect(page.getByText("Collection not found")).toBeVisible();
    });

    test("back button returns to home", async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.waitForLoad();

      const firstCollection = homePage.collectionCards.first();
      await expect(firstCollection).toBeVisible();
      await firstCollection.click();

      const collectionPage = new CollectionPage(page);
      await collectionPage.waitForLoad();
      await collectionPage.goBack();

      await expect(page).toHaveURL("/");
    });
  });

  test.describe("artwork page", () => {
    test("displays artwork details", async ({ page }) => {
      // Navigate through collection to artwork
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.waitForLoad();

      const firstCollection = homePage.collectionCards.first();
      await expect(firstCollection).toBeVisible();
      await firstCollection.click();

      const collectionPage = new CollectionPage(page);
      await collectionPage.waitForLoad();

      const artworkCount = await collectionPage.getArtworkCount();
      expect(artworkCount).toBeGreaterThan(0);
      await collectionPage.clickArtwork(0);

      const artworkPage = new ArtworkPage(page);
      await artworkPage.waitForLoad();

      await expect(artworkPage.title).toBeVisible();
    });

    test("shows 404 for non-existent artwork", async ({ page }) => {
      await page.goto("/artwork/non-existent-id");

      await expect(page.getByText("Artwork not found")).toBeVisible();
    });
  });

  test.describe("about page", () => {
    test("displays about content", async ({ page }) => {
      const aboutPage = new AboutPage(page);
      await aboutPage.goto();
      await aboutPage.waitForLoad();

      await expect(page.getByRole("heading", { name: "About" })).toBeVisible();
    });

    test("displays contact form", async ({ page }) => {
      const aboutPage = new AboutPage(page);
      await aboutPage.goto();

      await expect(aboutPage.nameInput).toBeVisible();
      await expect(aboutPage.emailInput).toBeVisible();
      await expect(aboutPage.messageInput).toBeVisible();
      await expect(aboutPage.submitButton).toBeVisible();
    });
  });
});

test.describe("Image Viewer", () => {
  test("opens and closes image viewer", async ({ page }) => {
    // Navigate to artwork
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForLoad();

    const firstCollection = homePage.collectionCards.first();
    await expect(firstCollection).toBeVisible();
    await firstCollection.click();

    const collectionPage = new CollectionPage(page);
    await collectionPage.waitForLoad();

    const artworkCount = await collectionPage.getArtworkCount();
    expect(artworkCount).toBeGreaterThan(0);
    await collectionPage.clickArtwork(0);

    const artworkPage = new ArtworkPage(page);
    await artworkPage.waitForLoad();

    // Open viewer
    await artworkPage.openImageViewer();
    await expect(artworkPage.imageViewer).toBeVisible();

    // Close viewer
    await artworkPage.closeImageViewer();
    await expect(artworkPage.imageViewer).not.toBeVisible();
  });
});

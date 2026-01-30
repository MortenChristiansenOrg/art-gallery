import { test, expect } from "./fixtures";
import { AdminPage } from "./pages";

test.describe("Admin CRUD Operations", () => {
  test.describe("artworks", () => {
    test("navigates to artworks tab", async ({ authenticatedPage }) => {
      const adminPage = new AdminPage(authenticatedPage);
      await adminPage.switchToArtworks();

      await expect(adminPage.artworksList).toBeVisible();
    });

    test("shows add new artwork button", async ({ authenticatedPage }) => {
      const adminPage = new AdminPage(authenticatedPage);
      await adminPage.switchToArtworks();

      await expect(adminPage.addNewArtworkButton).toBeVisible();
      await expect(adminPage.addNewArtworkButton).toHaveText("Add New Artwork");
    });

    test("shows add existing artwork button", async ({ authenticatedPage }) => {
      const adminPage = new AdminPage(authenticatedPage);
      await adminPage.switchToArtworks();

      await expect(adminPage.addExistingArtworkButton).toBeVisible();
      await expect(adminPage.addExistingArtworkButton).toHaveText("Add Existing Artwork");
    });

    test("add existing artwork button opens dialog", async ({ authenticatedPage }) => {
      const adminPage = new AdminPage(authenticatedPage);
      await adminPage.switchToArtworks();

      await adminPage.addExistingArtworkButton.click();
      await expect(
        authenticatedPage.locator('[data-testid="search-existing-input"]')
      ).toBeVisible();
    });
  });

  test.describe("collections", () => {
    test("navigates to collections tab", async ({ authenticatedPage }) => {
      const adminPage = new AdminPage(authenticatedPage);
      await adminPage.switchToCollections();

      await expect(adminPage.collectionsList).toBeVisible();
    });

    test("shows add collection button", async ({ authenticatedPage }) => {
      const adminPage = new AdminPage(authenticatedPage);
      await adminPage.switchToCollections();

      await expect(adminPage.addButton).toBeVisible();
    });
  });

  test.describe("messages", () => {
    test("navigates to messages tab", async ({ authenticatedPage }) => {
      const adminPage = new AdminPage(authenticatedPage);
      await adminPage.switchToMessages();

      await expect(adminPage.messagesList).toBeVisible();
    });
  });

  test.describe("content", () => {
    test("navigates to content tab", async ({ authenticatedPage }) => {
      const adminPage = new AdminPage(authenticatedPage);
      await adminPage.switchToContent();

      // Content tab should show About Page heading
      await expect(
        authenticatedPage.getByRole("heading", { name: "About Page" })
      ).toBeVisible();
    });
  });
});

test.describe("Admin Dashboard", () => {
  test("shows all tabs", async ({ authenticatedPage }) => {
    const adminPage = new AdminPage(authenticatedPage);

    await expect(adminPage.artworksTab).toBeVisible();
    await expect(adminPage.collectionsTab).toBeVisible();
    await expect(adminPage.messagesTab).toBeVisible();
    await expect(adminPage.contentTab).toBeVisible();
  });

  test("shows logout button", async ({ authenticatedPage }) => {
    const adminPage = new AdminPage(authenticatedPage);

    await expect(adminPage.logoutButton).toBeVisible();
  });
});

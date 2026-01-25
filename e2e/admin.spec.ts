import { test, expect } from "./fixtures";
import { AdminPage } from "./pages";

test.describe("Admin CRUD Operations", () => {
  test.describe("artworks", () => {
    test("navigates to artworks tab", async ({ authenticatedPage }) => {
      const adminPage = new AdminPage(authenticatedPage);
      await adminPage.switchToArtworks();

      await expect(adminPage.artworksList).toBeVisible();
    });

    test("shows add artwork button", async ({ authenticatedPage }) => {
      const adminPage = new AdminPage(authenticatedPage);
      await adminPage.switchToArtworks();

      await expect(adminPage.addButton).toBeVisible();
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

      // Content tab should show content editor
      await expect(
        authenticatedPage.getByText(/about|content/i)
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

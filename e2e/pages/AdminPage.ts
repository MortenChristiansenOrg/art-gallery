import type { Page, Locator } from "@playwright/test";

export class AdminPage {
  readonly page: Page;
  readonly dashboard: Locator;
  readonly loginForm: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  readonly artworksTab: Locator;
  readonly collectionsTab: Locator;
  readonly messagesTab: Locator;
  readonly contentTab: Locator;
  readonly addButton: Locator;
  readonly addNewArtworkButton: Locator;
  readonly addExistingArtworkButton: Locator;
  readonly artworksList: Locator;
  readonly collectionsList: Locator;
  readonly messagesList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboard = page.locator('[data-testid="admin-dashboard"]');
    this.loginForm = page.locator('[data-testid="login-form"]');
    this.passwordInput = page.getByPlaceholder(/password/i);
    this.loginButton = page.getByRole("button", { name: /login|sign in/i });
    this.logoutButton = page.getByRole("button", { name: /logout|sign out/i });
    this.artworksTab = page.getByRole("tab", { name: /artworks/i });
    this.collectionsTab = page.getByRole("tab", { name: /collections/i });
    this.messagesTab = page.getByRole("tab", { name: /messages/i });
    this.contentTab = page.getByRole("tab", { name: /content/i });
    this.addButton = page.getByRole("button", { name: /add|create|new/i }).first();
    this.addNewArtworkButton = page.locator('[data-testid="add-artwork-button"]');
    this.addExistingArtworkButton = page.locator('[data-testid="add-existing-artwork-button"]');
    this.artworksList = page.locator('[data-testid="artworks-list"]');
    this.collectionsList = page.locator('[data-testid="collections-list"]');
    this.messagesList = page.locator('[data-testid="messages-list"]');
  }

  async goto() {
    await this.page.goto("/admin");
  }

  async login(password: string) {
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.dashboard.waitFor({ state: "visible" });
  }

  async logout() {
    await this.logoutButton.click();
    await this.loginForm.waitFor({ state: "visible" });
  }

  async switchToArtworks() {
    await this.artworksTab.click();
    await this.artworksList.waitFor({ state: "visible" });
  }

  async switchToCollections() {
    await this.collectionsTab.click();
    await this.collectionsList.waitFor({ state: "visible" });
  }

  async switchToMessages() {
    await this.messagesTab.click();
    await this.messagesList.waitFor({ state: "visible" });
  }

  async switchToContent() {
    await this.contentTab.click();
  }

  async clickAdd() {
    await this.addButton.click();
  }

  async editArtwork(title: string) {
    await this.page
      .locator('[data-testid="artwork-item"]', { hasText: title })
      .getByRole("button", { name: /edit/i })
      .click();
  }

  async deleteArtwork(title: string) {
    await this.page
      .locator('[data-testid="artwork-item"]', { hasText: title })
      .getByRole("button", { name: /delete/i })
      .click();
  }
}

import type { Page, Locator } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly collectionsGrid: Locator;
  readonly collectionCards: Locator;
  readonly header: Locator;
  readonly footer: Locator;
  readonly aboutLink: Locator;
  readonly adminLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.collectionsGrid = page.locator('[data-testid="collections-grid"]');
    this.collectionCards = page.locator('[data-testid="collection-card"]');
    this.header = page.locator("header");
    this.footer = page.locator("footer");
    this.aboutLink = page.getByRole("link", { name: /about/i });
    this.adminLink = page.getByRole("link", { name: /admin/i });
  }

  async goto() {
    await this.page.goto("/");
  }

  async waitForLoad() {
    await this.collectionsGrid.waitFor({ state: "visible" });
  }

  async getCollectionCount() {
    return await this.collectionCards.count();
  }

  async clickCollection(name: string) {
    await this.page.getByRole("link", { name }).click();
  }

  async goToAbout() {
    await this.aboutLink.click();
  }

  async goToAdmin() {
    await this.adminLink.click();
  }
}

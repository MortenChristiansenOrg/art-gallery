import type { Page, Locator } from "@playwright/test";

export class CollectionPage {
  readonly page: Page;
  readonly title: Locator;
  readonly description: Locator;
  readonly artworkGrid: Locator;
  readonly artworkCards: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator("h1");
    this.description = page.locator('[data-testid="collection-description"]');
    this.artworkGrid = page.locator('[data-testid="artwork-grid"]');
    this.artworkCards = page.locator('[data-testid="artwork-card"]');
    this.backButton = page.locator('[data-testid="back-button"]');
  }

  async goto(slug: string) {
    await this.page.goto(`/collection/${slug}`);
  }

  async waitForLoad() {
    await this.artworkGrid.waitFor({ state: "visible" });
  }

  async getArtworkCount() {
    return await this.artworkCards.count();
  }

  async clickArtwork(index: number) {
    await this.artworkCards.nth(index).click();
  }

  async clickArtworkByTitle(title: string) {
    await this.page
      .locator('[data-testid="artwork-card"]', { hasText: title })
      .click();
  }

  async goBack() {
    await this.backButton.click();
  }
}

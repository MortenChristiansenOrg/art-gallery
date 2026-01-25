import type { Page, Locator } from "@playwright/test";

export class ArtworkPage {
  readonly page: Page;
  readonly title: Locator;
  readonly year: Locator;
  readonly medium: Locator;
  readonly dimensions: Locator;
  readonly description: Locator;
  readonly image: Locator;
  readonly imageViewer: Locator;
  readonly backButton: Locator;
  readonly closeViewerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('[data-testid="artwork-title"]');
    this.year = page.locator('[data-testid="artwork-year"]');
    this.medium = page.locator('[data-testid="artwork-medium"]');
    this.dimensions = page.locator('[data-testid="artwork-dimensions"]');
    this.description = page.locator('[data-testid="artwork-description"]');
    this.image = page.locator('[data-testid="artwork-image"]');
    this.imageViewer = page.locator('[data-testid="image-viewer"]');
    this.backButton = page.locator('[data-testid="back-button"]');
    this.closeViewerButton = page.locator('[data-testid="close-viewer"]');
  }

  async goto(collectionSlug: string, artworkId: string) {
    await this.page.goto(`/${collectionSlug}/${artworkId}`);
  }

  async waitForLoad() {
    await this.image.waitFor({ state: "visible" });
  }

  async openImageViewer() {
    await this.image.click();
    await this.imageViewer.waitFor({ state: "visible" });
  }

  async closeImageViewer() {
    await this.closeViewerButton.click();
  }

  async goBack() {
    await this.backButton.click();
  }
}

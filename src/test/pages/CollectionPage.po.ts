import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export class CollectionPage {
  private user = userEvent.setup();

  // Getters for elements
  get notFoundMessage() {
    return screen.queryByText("Collection not found");
  }

  get returnToCollectionsLink() {
    return screen.queryByRole("link", { name: /return to collections/i });
  }

  get allCollectionsLink() {
    return screen.queryByRole("link", { name: /all collections/i });
  }

  get emptyMessage() {
    return screen.queryByText("No works in this collection");
  }

  get skeletons() {
    return document.querySelectorAll(".skeleton-shimmer");
  }

  // Query methods
  getTitle(name: string) {
    return screen.queryByRole("heading", { name });
  }

  getDescription(description: string) {
    return screen.queryByText(description);
  }

  getArtworkByTitle(title: string) {
    return screen.queryByText(title);
  }

  getAllArtworkCards() {
    return screen.queryAllByRole("link");
  }

  // State checks
  isLoading(): boolean {
    return this.skeletons.length > 0;
  }

  isNotFound(): boolean {
    return this.notFoundMessage !== null;
  }

  isEmpty(): boolean {
    return this.emptyMessage !== null;
  }

  // Actions
  async clickArtwork(title: string) {
    const artwork = screen.getByText(title).closest("a");
    if (artwork) {
      await this.user.click(artwork);
    }
  }

  async clickBackToCollections() {
    const link = this.allCollectionsLink;
    if (link) {
      await this.user.click(link);
    }
  }
}

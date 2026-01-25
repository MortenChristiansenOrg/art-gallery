import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export class ArtworkPage {
  private user = userEvent.setup();

  // Getters for elements
  get notFoundMessage() {
    return screen.queryByText("Artwork not found");
  }

  get returnToCollectionsLink() {
    return screen.queryByRole("link", { name: /return to collections/i });
  }

  get cabinetLink() {
    return screen.queryByRole("link", { name: /cabinet of curiosities/i });
  }

  get imageViewer() {
    return screen.queryByTestId("image-viewer");
  }

  get viewFullscreenButton() {
    return screen.queryByRole("button", { name: /view artwork in fullscreen/i });
  }

  get closeViewerButton() {
    return screen.queryByRole("button", { name: /close/i });
  }

  get skeletons() {
    return document.querySelectorAll(".skeleton-shimmer");
  }

  // Query methods
  getTitle(title: string) {
    return screen.queryByRole("heading", { name: title });
  }

  getYear(year: number) {
    return screen.queryByText(year.toString());
  }

  getMedium(medium: string) {
    return screen.queryByText(medium);
  }

  getDimensions(dimensions: string) {
    return screen.queryByText(dimensions);
  }

  getDescription(description: string) {
    return screen.queryByText(description);
  }

  getImage(title: string) {
    return screen.queryByAltText(title);
  }

  getCollectionLink(collectionName: string) {
    return screen.queryAllByRole("link", { name: new RegExp(collectionName, "i") });
  }

  // State checks
  isLoading(): boolean {
    return this.skeletons.length > 0;
  }

  isNotFound(): boolean {
    return this.notFoundMessage !== null;
  }

  isViewerOpen(): boolean {
    return this.imageViewer !== null;
  }

  // Actions
  async openViewer() {
    const button = this.viewFullscreenButton;
    if (button) {
      await this.user.click(button);
    }
  }

  async openViewerWithKeyboard() {
    const button = this.viewFullscreenButton;
    if (button) {
      await this.user.type(button, "{Enter}");
    }
  }

  async closeViewer() {
    const button = this.closeViewerButton;
    if (button) {
      await this.user.click(button);
    }
  }

  async clickBackLink() {
    const link = this.cabinetLink ?? this.returnToCollectionsLink;
    if (link) {
      await this.user.click(link);
    }
  }
}

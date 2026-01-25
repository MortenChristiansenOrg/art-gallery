import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export class HomePage {
  private user = userEvent.setup();

  // Getters for elements
  get heroSection() {
    return screen.getByText(/A curated space/i).closest("section");
  }

  get heroText() {
    return screen.getByText(/A curated space/i);
  }

  get heroSubtext() {
    return screen.getByText(/for visual art/i);
  }

  get collectionsLabel() {
    return screen.getByText("Collections");
  }

  get emptyMessage() {
    return screen.queryByText("No collections to display");
  }

  get cabinetCard() {
    return screen.queryByText("Cabinet of Curiosities");
  }

  get skeletons() {
    return document.querySelectorAll(".skeleton-shimmer");
  }

  // Query methods for collections
  getCollectionByName(name: string) {
    return screen.queryByText(name);
  }

  getAllCollectionCards() {
    return screen.queryAllByRole("link");
  }

  // State checks
  isLoading(): boolean {
    return this.skeletons.length > 0;
  }

  hasContent(): boolean {
    return this.emptyMessage === null;
  }

  hasCabinet(): boolean {
    return this.cabinetCard !== null;
  }

  // Actions
  async clickCollection(name: string) {
    const card = screen.getByText(name).closest("a");
    if (card) {
      await this.user.click(card);
    }
  }
}

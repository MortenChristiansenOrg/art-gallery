import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export class CollectionsGridPO {
  private user = userEvent.setup();
  private container: HTMLElement;

  constructor(container?: HTMLElement) {
    this.container = container ?? document.body;
  }

  private get scope() {
    return within(this.container);
  }

  // Getters for elements
  get grid() {
    return this.container.querySelector(".grid");
  }

  get allLinks() {
    return this.scope.queryAllByRole("link");
  }

  // Query methods
  getCollectionByName(name: string) {
    return this.scope.queryByText(name);
  }

  getLastLink(): HTMLElement | null {
    const links = this.allLinks;
    return links.length > 0 ? links[links.length - 1] : null;
  }

  // State checks
  hasGridClasses(): boolean {
    const grid = this.grid;
    if (!grid) return false;
    return (
      grid.classList.contains("grid-cols-1") &&
      grid.classList.contains("lg:grid-cols-2")
    );
  }

  isEmpty(): boolean {
    return this.allLinks.length === 0;
  }

  getCollectionCount(): number {
    return this.allLinks.length;
  }

  // Actions
  async clickCollection(name: string) {
    const collection = this.scope.getByText(name).closest("a");
    if (collection) {
      await this.user.click(collection);
    }
  }
}

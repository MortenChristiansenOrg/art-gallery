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

  get cabinetCard() {
    return this.scope.queryByText("Cabinet of Curiosities");
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

  hasCabinet(): boolean {
    return this.cabinetCard !== null;
  }

  isCabinetLast(): boolean {
    const lastLink = this.getLastLink();
    return lastLink?.getAttribute("href") === "/collection/cabinet-of-curiosities";
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

  async clickCabinet() {
    const cabinet = this.cabinetCard?.closest("a");
    if (cabinet) {
      await this.user.click(cabinet);
    }
  }
}

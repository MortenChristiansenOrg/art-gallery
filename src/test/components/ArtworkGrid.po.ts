import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export class ArtworkGridPO {
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
  getArtworkByTitle(title: string) {
    return this.scope.queryByText(title);
  }

  getStaggerClass(index: number): HTMLElement | null {
    return this.container.querySelector(`.stagger-${index}`);
  }

  // State checks
  hasGridClasses(): boolean {
    const grid = this.grid;
    if (!grid) return false;
    return (
      grid.classList.contains("grid-cols-1") &&
      grid.classList.contains("sm:grid-cols-2") &&
      grid.classList.contains("lg:grid-cols-3")
    );
  }

  isEmpty(): boolean {
    return this.allLinks.length === 0;
  }

  getArtworkCount(): number {
    return this.allLinks.length;
  }

  // Actions
  async clickArtwork(title: string) {
    const artwork = this.scope.getByText(title).closest("a");
    if (artwork) {
      await this.user.click(artwork);
    }
  }
}

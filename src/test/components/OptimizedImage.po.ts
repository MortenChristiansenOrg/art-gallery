import { screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export class OptimizedImagePO {
  private user = userEvent.setup();
  private container: HTMLElement;

  constructor(container?: HTMLElement) {
    this.container = container ?? document.body;
  }

  private get scope() {
    return within(this.container);
  }

  // Getters for elements
  get noImagePlaceholder() {
    return this.scope.queryByText("No image");
  }

  get failedToLoadMessage() {
    return this.scope.queryByText("Failed to load");
  }

  get loadingShimmer() {
    return this.container.querySelector(".skeleton-shimmer");
  }

  // Query methods
  getImage(alt: string) {
    return this.scope.queryByAltText(alt);
  }

  getAspectRatio(): string | null {
    const firstChild = this.container.firstChild as HTMLElement;
    return firstChild?.style.aspectRatio ?? null;
  }

  // State checks
  isLoading(): boolean {
    return this.loadingShimmer !== null;
  }

  hasNoImage(): boolean {
    return this.noImagePlaceholder !== null;
  }

  hasFailed(): boolean {
    return this.failedToLoadMessage !== null;
  }

  hasLoaded(alt: string): boolean {
    const img = this.getImage(alt);
    return img !== null && this.loadingShimmer === null;
  }

  // Actions (trigger image events)
  simulateLoad(alt: string) {
    const img = this.getImage(alt);
    if (img) {
      fireEvent.load(img);
    }
  }

  simulateError(alt: string) {
    const img = this.getImage(alt);
    if (img) {
      fireEvent.error(img);
    }
  }
}

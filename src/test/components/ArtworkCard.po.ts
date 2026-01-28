import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export class ArtworkCardPO {
  private user = userEvent.setup();
  private container: HTMLElement;

  constructor(container?: HTMLElement) {
    this.container = container ?? document.body;
  }

  private get scope() {
    return within(this.container);
  }

  // Getters for elements
  get title() {
    return this.scope.queryByText(/^(?!No image).*$/);
  }

  get link() {
    return this.scope.queryByRole("link");
  }

  get button() {
    return this.scope.queryByRole("button");
  }

  get noImagePlaceholder() {
    return this.scope.queryByText("No image");
  }

  // Query methods
  getImage(alt: string) {
    return this.scope.queryByAltText(alt);
  }

  getYear(year: number) {
    return this.scope.queryByText(year.toString());
  }

  getTitleText(text: string) {
    return this.scope.queryByText(text);
  }

  getStaggerClass(index: number): HTMLElement | null {
    const stagger = ((index % 9) + 1).toString();
    return this.container.querySelector(`.stagger-${stagger}`);
  }

  // State checks
  isLink(): boolean {
    return this.link !== null;
  }

  isButton(): boolean {
    return this.button !== null;
  }

  hasImage(): boolean {
    return this.noImagePlaceholder === null;
  }

  // Actions
  async click() {
    const element = this.button ?? this.link;
    if (element) {
      await this.user.click(element);
    }
  }

  async pressEnter() {
    const element = this.button ?? this.link;
    if (element) {
      await this.user.type(element, "{Enter}");
    }
  }
}

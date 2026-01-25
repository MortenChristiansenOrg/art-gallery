import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export class CollectionCardPO {
  private user = userEvent.setup();
  private container: HTMLElement;

  constructor(container?: HTMLElement) {
    this.container = container ?? document.body;
  }

  private get scope() {
    return within(this.container);
  }

  // Getters for elements
  get link() {
    return this.scope.queryByRole("link");
  }

  get workCount() {
    return this.scope.queryByText(/\d+ works?/);
  }

  // Query methods
  getName(name: string) {
    return this.scope.queryByText(name);
  }

  getDescription(description: string) {
    return this.scope.queryByText(description);
  }

  getCoverImage(alt: string) {
    return this.scope.queryByAltText(alt);
  }

  getFallbackLetter(letter: string) {
    return this.scope.queryByText(letter);
  }

  getLinkHref(): string | null {
    const link = this.link;
    return link?.getAttribute("href") ?? null;
  }

  getAnimationDelay(): string | null {
    const link = this.container.querySelector("a");
    return link?.style.animationDelay ?? null;
  }

  // State checks
  hasCoverImage(alt: string): boolean {
    return this.getCoverImage(alt) !== null;
  }

  hasFallbackLetter(): boolean {
    // Check if single letter is displayed (fallback when no image)
    const singleLetters = this.container.querySelectorAll('[class*="text-"]');
    return singleLetters.length > 0;
  }

  // Actions
  async click() {
    const link = this.link;
    if (link) {
      await this.user.click(link);
    }
  }
}

export class CabinetCardPO {
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
    return this.scope.queryByText("Cabinet of Curiosities");
  }

  get description() {
    return this.scope.queryByText("Uncategorized works and experiments");
  }

  get link() {
    return this.scope.queryByRole("link");
  }

  get workCount() {
    return this.scope.queryByText(/\d+ works?/);
  }

  // Query methods
  getLinkHref(): string | null {
    const link = this.link;
    return link?.getAttribute("href") ?? null;
  }

  getAnimationDelay(): string | null {
    const link = this.container.querySelector("a");
    return link?.style.animationDelay ?? null;
  }

  // State checks
  hasCorrectLink(): boolean {
    return this.getLinkHref() === "/collection/cabinet-of-curiosities";
  }

  // Actions
  async click() {
    const link = this.link;
    if (link) {
      await this.user.click(link);
    }
  }
}

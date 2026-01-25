import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export class LayoutPO {
  private user = userEvent.setup();
  private container: HTMLElement;

  constructor(container?: HTMLElement) {
    this.container = container ?? document.body;
  }

  private get scope() {
    return within(this.container);
  }

  // Getters for elements
  get header() {
    return this.scope.queryByRole("banner");
  }

  get footer() {
    return this.scope.queryByRole("contentinfo");
  }

  get main() {
    return this.scope.queryByRole("main");
  }

  get worksLink() {
    return this.scope.queryByRole("link", { name: /works/i });
  }

  get aboutLink() {
    return this.scope.queryByRole("link", { name: /about/i });
  }

  get galleryLink() {
    return this.scope.queryByRole("link", { name: /gallery/i });
  }

  // Query methods
  getContent(text: string) {
    return this.scope.queryByText(text);
  }

  getCopyrightYear() {
    const year = new Date().getFullYear().toString();
    return this.scope.queryByText(new RegExp(year));
  }

  getAllGalleryText() {
    return this.scope.queryAllByText(/gallery/i);
  }

  // State checks
  hasHeader(): boolean {
    return this.header !== null;
  }

  hasFooter(): boolean {
    return this.footer !== null;
  }

  hasMain(): boolean {
    return this.main !== null;
  }

  hasNavigation(): boolean {
    return this.worksLink !== null && this.aboutLink !== null;
  }

  // Actions
  async clickWorks() {
    const link = this.worksLink;
    if (link) {
      await this.user.click(link);
    }
  }

  async clickAbout() {
    const link = this.aboutLink;
    if (link) {
      await this.user.click(link);
    }
  }

  async clickGalleryLogo() {
    const link = this.galleryLink;
    if (link) {
      await this.user.click(link);
    }
  }
}

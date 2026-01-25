import { screen, within, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export class IconPickerPO {
  private user = userEvent.setup();
  private container: HTMLElement;

  constructor(container?: HTMLElement) {
    this.container = container ?? document.body;
  }

  private get scope() {
    return within(this.container);
  }

  // Getters for elements
  get searchInput() {
    return this.scope.queryByPlaceholderText("Search icons...");
  }

  get labelText() {
    return this.scope.queryByText(/Or pick an icon \(game-icons.net\)/i);
  }

  get selectedIconLabel() {
    return this.scope.queryByText("Selected icon");
  }

  get removeButton() {
    return this.scope.queryByRole("button", { name: /remove/i });
  }

  get noResultsMessage() {
    return this.scope.queryByText("No icons found");
  }

  // Query methods
  getIconByAlt(name: string) {
    return this.scope.queryByAltText(name);
  }

  getIconButton(name: string) {
    return this.scope.queryByTitle(name);
  }

  // State checks
  hasSelectedIcon(): boolean {
    return this.selectedIconLabel !== null;
  }

  hasNoResults(): boolean {
    return this.noResultsMessage !== null;
  }

  // Actions
  async search(query: string) {
    const input = this.searchInput;
    if (input) {
      await this.user.type(input, query);
    }
  }

  async clearSearch() {
    const input = this.searchInput;
    if (input) {
      await this.user.clear(input);
    }
  }

  async changeSearch(value: string) {
    const input = this.searchInput;
    if (input) {
      fireEvent.change(input, { target: { value } });
    }
  }

  async removeIcon() {
    const button = this.removeButton;
    if (button) {
      await this.user.click(button);
    }
  }

  async selectIcon(name: string) {
    const button = this.getIconButton(name);
    if (button) {
      await this.user.click(button);
    }
  }
}

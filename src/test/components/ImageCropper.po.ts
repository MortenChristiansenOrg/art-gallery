import { screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export class ImageCropperPO {
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
    return this.scope.queryByText("Crop Cover Image");
  }

  get applyCropButton() {
    return this.scope.queryByRole("button", { name: /apply crop/i });
  }

  get cancelButton() {
    return this.scope.queryByRole("button", { name: /cancel/i });
  }

  get helpText() {
    return this.scope.queryByText(/drag to move, drag corner to resize/i);
  }

  get canvas() {
    return this.container.querySelector("canvas");
  }

  // State checks
  isVisible(): boolean {
    return this.title !== null;
  }

  hasCanvas(): boolean {
    return this.canvas !== null;
  }

  // Actions
  async cancel() {
    const button = this.cancelButton;
    if (button) {
      await this.user.click(button);
    }
  }

  async applyCrop() {
    const button = this.applyCropButton;
    if (button) {
      await this.user.click(button);
    }
  }
}

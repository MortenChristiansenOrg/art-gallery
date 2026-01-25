import { screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export class ArtworkFormPO {
  private user = userEvent.setup();
  private container: HTMLElement;

  constructor(container?: HTMLElement) {
    this.container = container ?? document.body;
  }

  private get scope() {
    return within(this.container);
  }

  // Getters for elements
  get addTitle() {
    return this.scope.queryByText("Add Artwork");
  }

  get editTitle() {
    return this.scope.queryByText("Edit Artwork");
  }

  get fileInput() {
    return this.scope.queryByTestId("file-input");
  }

  get dragDropZone() {
    return this.scope.queryByText(/click or drag images here/i);
  }

  get submitButton() {
    return this.scope.queryByTestId("submit-button");
  }

  get cancelButton() {
    return this.scope.queryByRole("button", { name: /cancel/i });
  }

  get publishedToggle() {
    return this.scope.queryByTestId("published-toggle");
  }

  get titleLabel() {
    return this.scope.queryByText("Title *");
  }

  get yearLabel() {
    return this.scope.queryByText("Year");
  }

  get mediumLabel() {
    return this.scope.queryByText("Medium");
  }

  get dimensionsLabel() {
    return this.scope.queryByText("Dimensions");
  }

  get descriptionLabel() {
    return this.scope.queryByText("Description");
  }

  // Query methods
  getFieldByValue(value: string) {
    return this.scope.queryByDisplayValue(value);
  }

  getTitleInput() {
    return this.scope.queryByDisplayValue(/./); // Gets first input with any value
  }

  // State checks
  isCreateMode(): boolean {
    return this.addTitle !== null;
  }

  isEditMode(): boolean {
    return this.editTitle !== null;
  }

  isSubmitDisabled(): boolean {
    const button = this.submitButton;
    return button?.hasAttribute("disabled") ?? true;
  }

  // Actions
  async cancel() {
    const button = this.cancelButton;
    if (button) {
      await this.user.click(button);
    }
  }

  async submit() {
    const button = this.submitButton;
    if (button && !button.hasAttribute("disabled")) {
      await this.user.click(button);
    }
  }

  async fillTitle(title: string) {
    const input = this.scope.getByDisplayValue("");
    await this.user.type(input, title);
  }

  async fillYear(year: string) {
    const inputs = this.scope.getAllByRole("spinbutton");
    if (inputs.length > 0) {
      await this.user.type(inputs[0], year);
    }
  }

  async fillMedium(medium: string) {
    // Medium is typically the second text input
    const inputs = this.scope.getAllByRole("textbox");
    if (inputs.length > 2) {
      await this.user.type(inputs[2], medium);
    }
  }

  async fillDescription(description: string) {
    const textarea = this.container.querySelector("textarea");
    if (textarea) {
      await this.user.type(textarea, description);
    }
  }
}

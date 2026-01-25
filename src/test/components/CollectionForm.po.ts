import { within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export class CollectionFormPO {
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
    return this.scope.queryByText("Add Collection");
  }

  get editTitle() {
    return this.scope.queryByText("Edit Collection");
  }

  get nameLabel() {
    return this.scope.queryByText("Name *");
  }

  get slugLabel() {
    return this.scope.queryByText("Slug *");
  }

  get descriptionLabel() {
    return this.scope.queryByText("Description");
  }

  get uploadZone() {
    return this.scope.queryByText(/click or drag image here/i);
  }

  get iconPickerLabel() {
    return this.scope.queryByText(/or pick an icon/i);
  }

  get cancelButton() {
    return this.scope.queryByRole("button", { name: /cancel/i });
  }

  get selectedIconLabel() {
    return this.scope.queryByText("Selected icon");
  }

  // Query methods
  getFieldByValue(value: string) {
    return this.scope.queryByDisplayValue(value);
  }

  getNameInput() {
    const inputs = this.scope.getAllByRole("textbox");
    return inputs[0] ?? null;
  }

  getSlugInput() {
    const inputs = this.scope.getAllByRole("textbox");
    return inputs[1] ?? null;
  }

  getDescriptionInput() {
    const inputs = this.scope.getAllByRole("textbox");
    return inputs[2] ?? null;
  }

  // State checks
  isCreateMode(): boolean {
    return this.addTitle !== null;
  }

  isEditMode(): boolean {
    return this.editTitle !== null;
  }

  hasSelectedIcon(): boolean {
    return this.selectedIconLabel !== null;
  }

  isNameRequired(): boolean {
    const input = this.getNameInput();
    return input?.hasAttribute("required") ?? false;
  }

  isSlugRequired(): boolean {
    const input = this.getSlugInput();
    return input?.hasAttribute("required") ?? false;
  }

  // Actions
  async cancel() {
    const button = this.cancelButton;
    if (button) {
      await this.user.click(button);
    }
  }

  async fillName(name: string) {
    const input = this.getNameInput();
    if (input) {
      fireEvent.change(input, { target: { value: name } });
    }
  }

  async fillSlug(slug: string) {
    const input = this.getSlugInput();
    if (input) {
      fireEvent.change(input, { target: { value: slug } });
    }
  }

  async fillDescription(description: string) {
    const input = this.getDescriptionInput();
    if (input) {
      fireEvent.change(input, { target: { value: description } });
    }
  }

  async changeName(name: string) {
    const input = this.getNameInput();
    if (input) {
      fireEvent.change(input, { target: { value: name } });
    }
  }
}

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export class AboutPage {
  private user = userEvent.setup();

  // Getters for elements
  get pageHeading() {
    return screen.getByRole("heading", { name: "About" });
  }

  get getInTouchHeading() {
    return screen.getByRole("heading", { name: /get in touch/i });
  }

  get nameInput() {
    return screen.getByPlaceholderText("Your name");
  }

  get emailInput() {
    return screen.getByPlaceholderText("your@email.com");
  }

  get messageInput() {
    return screen.getByPlaceholderText("Your message...");
  }

  get submitButton() {
    return screen.getByRole("button", { name: /send message/i });
  }

  get sendingButton() {
    return screen.queryByRole("button", { name: /sending/i });
  }

  get successMessage() {
    return screen.queryByText("Thank you for your message");
  }

  get errorMessage() {
    return screen.queryByText("Something went wrong. Please try again.");
  }

  get defaultAboutText() {
    return screen.queryByText("Welcome to my gallery.");
  }

  // Query methods
  getAboutText(text: string) {
    return screen.queryByText(text);
  }

  getParagraph(text: string) {
    return screen.queryByText(text);
  }

  // State checks
  isSending(): boolean {
    return this.sendingButton !== null;
  }

  hasSucceeded(): boolean {
    return this.successMessage !== null;
  }

  hasError(): boolean {
    return this.errorMessage !== null;
  }

  // Actions
  async fillName(name: string) {
    await this.user.type(this.nameInput, name);
  }

  async fillEmail(email: string) {
    await this.user.type(this.emailInput, email);
  }

  async fillMessage(message: string) {
    await this.user.type(this.messageInput, message);
  }

  async submit() {
    await this.user.click(this.submitButton);
  }

  async sendMessage(name: string, email: string, message: string) {
    await this.fillName(name);
    await this.fillEmail(email);
    await this.fillMessage(message);
    await this.submit();
  }
}

import type { Page, Locator } from "@playwright/test";

export class AboutPage {
  readonly page: Page;
  readonly content: Locator;
  readonly contactForm: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly messageInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.content = page.locator('[data-testid="about-content"]');
    this.contactForm = page.locator('[data-testid="contact-form"]');
    this.nameInput = page.getByLabel(/name/i);
    this.emailInput = page.getByLabel(/email/i);
    this.messageInput = page.getByLabel(/message/i);
    this.submitButton = page.getByRole("button", { name: /send|submit/i });
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async goto() {
    await this.page.goto("/about");
  }

  async waitForLoad() {
    await this.content.waitFor({ state: "visible" });
  }

  async fillContactForm(name: string, email: string, message: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.messageInput.fill(message);
  }

  async submitContactForm() {
    await this.submitButton.click();
  }

  async waitForSuccess() {
    await this.successMessage.waitFor({ state: "visible" });
  }
}

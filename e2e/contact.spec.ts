import { test, expect } from "@playwright/test";
import { AboutPage } from "./pages";

test.describe("Contact Form", () => {
  test("displays all form fields", async ({ page }) => {
    const aboutPage = new AboutPage(page);
    await aboutPage.goto();

    await expect(aboutPage.nameInput).toBeVisible();
    await expect(aboutPage.emailInput).toBeVisible();
    await expect(aboutPage.messageInput).toBeVisible();
    await expect(aboutPage.submitButton).toBeVisible();
  });

  test("requires all fields", async ({ page }) => {
    const aboutPage = new AboutPage(page);
    await aboutPage.goto();

    // Try to submit empty form
    await aboutPage.submitContactForm();

    // Form should still be visible (validation prevented submit)
    await expect(aboutPage.contactForm).toBeVisible();
  });

  test("validates email format", async ({ page }) => {
    const aboutPage = new AboutPage(page);
    await aboutPage.goto();

    await aboutPage.fillContactForm("John Doe", "invalid-email", "Hello");
    await aboutPage.submitContactForm();

    // Form should still be visible (invalid email)
    await expect(aboutPage.contactForm).toBeVisible();
  });

  test("submits form successfully", async ({ page }) => {
    const aboutPage = new AboutPage(page);
    await aboutPage.goto();

    await aboutPage.fillContactForm(
      "Test User",
      "test@example.com",
      "This is a test message from E2E tests."
    );
    await aboutPage.submitContactForm();

    // Wait for success message
    await aboutPage.waitForSuccess();
    await expect(aboutPage.successMessage).toBeVisible();
  });

  test("shows success message content", async ({ page }) => {
    const aboutPage = new AboutPage(page);
    await aboutPage.goto();

    await aboutPage.fillContactForm(
      "Test User",
      "test@example.com",
      "Test message"
    );
    await aboutPage.submitContactForm();

    await aboutPage.waitForSuccess();
    await expect(page.getByText(/thank you/i)).toBeVisible();
  });
});

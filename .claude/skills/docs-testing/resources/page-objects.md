# Page Object Pattern

**Mandatory for all tests.** Encapsulates selectors and actions for reuse.

---

## Folder Structure

```
src/test/
  pages/           # Unit test page objects
    LoginPage.po.ts
    ArtworkListPage.po.ts
  components/      # Component page objects
    ArtworkCard.po.ts
    CollectionForm.po.ts
e2e/
  pages/           # E2E page objects
    AdminPage.ts
    GalleryPage.ts
smoke/
  pages/           # Smoke page objects (can share with e2e)
```

---

## Unit Test Page Object

```ts
// src/test/pages/LoginPage.po.ts
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export class LoginPage {
  private user = userEvent.setup();

  // Getters for elements
  get emailInput() {
    return screen.getByRole("textbox", { name: /email/i });
  }

  get passwordInput() {
    return screen.getByLabelText(/password/i);
  }

  get submitButton() {
    return screen.getByRole("button", { name: /sign in/i });
  }

  get errorMessage() {
    return screen.queryByRole("alert");
  }

  // Actions
  async fillEmail(email: string) {
    await this.user.type(this.emailInput, email);
  }

  async fillPassword(password: string) {
    await this.user.type(this.passwordInput, password);
  }

  async submit() {
    await this.user.click(this.submitButton);
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }
}
```

---

## Component Page Object

For testing components in isolation with a scoped container:

```ts
// src/test/components/CollectionForm.po.ts
import { screen, within } from "@testing-library/react";
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

  get nameInput() {
    return this.scope.getByRole("textbox", { name: /name/i });
  }

  get descriptionInput() {
    return this.scope.getByRole("textbox", { name: /description/i });
  }

  get saveButton() {
    return this.scope.getByRole("button", { name: /save/i });
  }

  async fillName(name: string) {
    await this.user.clear(this.nameInput);
    await this.user.type(this.nameInput, name);
  }

  async save() {
    await this.user.click(this.saveButton);
  }
}
```

---

## E2E/Playwright Page Object

```ts
// e2e/pages/AdminPage.ts
import { Page, Locator } from "@playwright/test";

export class AdminPage {
  readonly page: Page;
  readonly artworksTab: Locator;
  readonly addArtworkButton: Locator;
  readonly artworksList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.artworksTab = page.getByRole("tab", { name: /artworks/i });
    this.addArtworkButton = page.getByRole("button", { name: /add artwork/i });
    this.artworksList = page.getByTestId("artworks-list");
  }

  async goto() {
    await this.page.goto("/admin");
  }

  async navigateToArtworks() {
    await this.artworksTab.click();
  }

  async createArtwork(title: string) {
    await this.addArtworkButton.click();
    await this.page.getByRole("textbox", { name: /title/i }).fill(title);
    await this.page.getByRole("button", { name: /save/i }).click();
  }

  async getArtworkCount(): Promise<number> {
    return this.artworksList.getByRole("listitem").count();
  }
}
```

---

## Usage Examples

### Unit Test

```ts
describe("LoginPage", () => {
  it("shows error on invalid credentials", async () => {
    render(<LoginPage />);
    const page = new LoginPagePO();

    await page.login("bad@email.com", "wrongpassword");

    expect(page.errorMessage).toHaveTextContent("Invalid credentials");
  });
});
```

### E2E Test

```ts
test("admin can create artwork", async ({ page }) => {
  const admin = new AdminPage(page);
  await admin.goto();
  await admin.navigateToArtworks();

  const initialCount = await admin.getArtworkCount();
  await admin.createArtwork("New Artwork");

  expect(await admin.getArtworkCount()).toBe(initialCount + 1);
});
```

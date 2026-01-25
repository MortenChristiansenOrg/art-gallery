# E2E Testing

Playwright + convex-test for simulated backend tests.

---

## What to Test

- All user flows (happy path + error states)
- Navigation between pages
- Form submissions with validation
- Authentication flows
- Edge cases with specific data states

---

## File Location

```
e2e/
  auth.spec.ts
  gallery.spec.ts
  admin.spec.ts
  pages/
    AdminPage.ts
    GalleryPage.ts
  fixtures.ts
```

---

## Auth Fixtures

```ts
// e2e/fixtures.ts
import { test as base } from "@playwright/test";

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<{}, AuthFixtures>({
  authenticatedPage: [
    async ({ browser }, use) => {
      const context = await browser.newContext({
        storageState: "e2e/.auth/user.json",
      });
      const page = await context.newPage();
      await use(page);
      await context.close();
    },
    { scope: "worker" },
  ],
});
```

---

## Conditional Content Pattern

For testing dynamic data:

```ts
test("displays artworks or empty state", async ({ page }) => {
  await page.goto("/gallery");

  // Wait for either artworks OR empty state
  await expect(
    page.getByTestId("artwork-grid").or(page.getByText("No artworks yet")),
  ).toBeVisible();

  // Then branch logic if needed
  const hasArtworks = await page.getByTestId("artwork-grid").isVisible();
  if (hasArtworks) {
    // Test artwork interactions
  }
});
```

---

## Playwright Assertions

```ts
await expect(locator).toBeVisible();
await expect(locator).toHaveText("text");
await expect(page).toHaveURL("/path");
```

---

## Page Object Example

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

## Usage

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

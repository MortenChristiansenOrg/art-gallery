# E2E Testing

Playwright with FakeConvexClient via separate entry point. NO mock code in production.

---

## Architecture

E2E tests use dependency injection to swap the real Convex client for a fake:

```
Production:  main.tsx → ConvexReactClient → real backend
E2E:         src/test/e2e/main.tsx → FakeConvexClient → mock data
```

Build command: `vite build --config vite.config.e2e.ts`

---

## File Structure

```
src/test/e2e/
  main.tsx            # E2E entry point (replaces src/main.tsx)
  fakeConvexClient.ts # ConvexReactClientFake implementation
  mockData.ts         # Typed mock data
e2e/
  *.spec.ts           # Test files
  pages/              # Page objects
  fixtures.ts         # Auth fixtures
```

---

## What to Test

- All user flows (happy path + error states)
- Navigation between pages
- Form submissions with validation
- Authentication flows
- Edge cases with specific data states

---

## FakeConvexClient Pattern

The custom FakeConvexClient implements the ConvexReactClient interface with mock handlers:

```ts
// src/test/e2e/fakeConvexClient.ts
import { getFunctionName, type FunctionReference } from "convex/server";

// Query handlers keyed by function name (e.g., "artworks:list")
const queryHandlers: Record<string, (args: unknown) => unknown> = {
  "artworks:list": () => mockArtworks,
  "artworks:get": (args) => mockArtworks.find(a => a._id === args.id),
  // ...
};

// Mutation handlers
const mutationHandlers: Record<string, (args: unknown) => Promise<unknown>> = {
  "auth:login": async ({ password }) => {
    if (password === "test-password") return { success: true, token: "..." };
    return { success: false, error: "Invalid password" };
  },
  // ...
};

export class FakeConvexClient {
  watchQuery(query, ...args) {
    const name = getFunctionName(query);  // Returns "module:function"
    const handler = queryHandlers[name];
    // Returns Watch<T> interface
  }

  async mutation(mutation, ...args) {
    const name = getFunctionName(mutation);
    return mutationHandlers[name](args[0]);
  }
}
```

---

## E2E Entry Point

App accepts optional `client` prop for dependency injection:

```ts
// src/test/e2e/main.tsx
import type { ConvexReactClient } from "convex/react";
import App from "../../App";
import { fakeConvexClient } from "./fakeConvexClient";

const client = fakeConvexClient as unknown as ConvexReactClient;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App client={client} />
  </StrictMode>
);
```

```ts
// src/App.tsx - supports DI
function App({ client = defaultClient }: { client?: ConvexReactClient }) {
  return (
    <ConvexProvider client={client}>
      ...
    </ConvexProvider>
  );
}
```

---

## Mock Data

```ts
// src/test/e2e/mockData.ts
import type { Doc } from "../../../convex/_generated/dataModel";

export const mockArtworks: Doc<"artworks">[] = [
  {
    _id: "artwork1" as Id<"artworks">,
    _creationTime: Date.now(),
    title: "Starry Night",
    year: 1889,
    // ... typed fields
  },
];
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

## Page Object Example

```ts
// e2e/pages/AdminPage.ts
import { Page, Locator } from "@playwright/test";

export class AdminPage {
  readonly page: Page;
  readonly artworksTab: Locator;
  readonly addArtworkButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.artworksTab = page.getByRole("tab", { name: /artworks/i });
    this.addArtworkButton = page.getByRole("button", { name: /add artwork/i });
  }

  async goto() {
    await this.page.goto("/admin");
  }

  async createArtwork(title: string) {
    await this.addArtworkButton.click();
    await this.page.getByRole("textbox", { name: /title/i }).fill(title);
    await this.page.getByRole("button", { name: /save/i }).click();
  }
}
```

---

## Test Example

```ts
test("admin can create artwork", async ({ page }) => {
  const admin = new AdminPage(page);
  await admin.goto();
  await admin.createArtwork("New Artwork");
  await expect(page.getByText("New Artwork")).toBeVisible();
});
```

---

## Playwright Assertions

```ts
await expect(locator).toBeVisible();
await expect(locator).toHaveText("text");
await expect(page).toHaveURL("/path");
```

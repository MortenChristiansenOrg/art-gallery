# Smoke Testing

Playwright against real PR preview environments. Limited scope.

---

## What to Test

Critical happy paths only (~5-10 tests):

- Gallery loads and displays artworks
- Collections page works
- Single artwork detail page
- Admin login
- Admin CRUD (create, read, update, delete artwork)
- Contact form submission
- Search functionality

---

## File Location

```
smoke/
  gallery.spec.ts
  admin.spec.ts
  pages/
  playwright.config.ts
```

---

## Configuration

```ts
// smoke/playwright.config.ts
export default defineConfig({
  use: {
    baseURL: process.env.PREVIEW_URL || "https://preview.example.com",
  },
  testDir: "./smoke",
});
```

---

## Run Conditions

- **Not on every commit** - too slow, too flaky
- Run on: PR creation, PR update, deploy to staging/production
- Configure in CI pipeline

---

## Key Differences from E2E

| Aspect  | E2E (convex-test)     | Smoke (real backend)   |
| ------- | --------------------- | ---------------------- |
| Backend | Simulated             | Real PR preview        |
| Data    | Deterministic/seeded  | Real production-like   |
| Scope   | All flows + errors    | Critical happy paths   |
| Speed   | Medium                | Slow                   |
| When    | Every commit          | PR/deploy only         |

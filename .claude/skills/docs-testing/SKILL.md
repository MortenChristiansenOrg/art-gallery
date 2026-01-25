---
name: docs-testing
description: Authoritative testing reference. Use when writing, rewriting, or understanding tests. Covers vitest (unit/component) and Playwright (E2E/smoke).
---

# Testing Reference

Canonical guide for all testing in this project. See sub-documents for detailed conventions.

---

## Commands

| Command        | Purpose                    | Pattern                  |
| -------------- | -------------------------- | ------------------------ |
| `bun test:run` | Run unit/component tests   | `src/**/*.test.{ts,tsx}` |
| `bun e2e`      | Run E2E tests              | `e2e/*.spec.ts`          |
| `bun e2e:ui`   | Run E2E with Playwright UI | `e2e/*.spec.ts`          |
| `bun smoke`    | Run smoke tests            | `smoke/*.spec.ts`        |

---

## Test Pyramid

| Layer          | Tool                     | Backend         | Speed  | Runs On      |
| -------------- | ------------------------ | --------------- | ------ | ------------ |
| Unit/Component | Vitest + Testing Library | Mocked hooks    | Fast   | Every commit |
| E2E            | Playwright + convex-test | Simulated       | Medium | Every commit |
| Smoke          | Playwright               | Real PR preview | Slow   | PR/deploy    |

**Unit tests** mock all external dependencies. Fast, isolated, high coverage.

**E2E tests** use convex-test for a simulated backend. Test complete user flows with deterministic data.

**Smoke tests** hit real PR preview environments. Limited to critical happy paths only.

---

## Coverage by Code Type

| Code Type            | Test Type  | Focus                                              |
| -------------------- | ---------- | -------------------------------------------------- |
| React components     | Unit       | Rendering states, user interactions, state changes |
| Pages                | Unit + E2E | Route params, data loading, navigation flows       |
| Pure functions       | Unit       | Edge cases, input validation, transformations      |
| User flows           | E2E        | All paths including error states                   |
| Critical happy paths | Smoke      | 5-10 tests: browse, login, CRUD artwork            |

---

## File Naming

- Unit/component tests: `*.test.ts` or `*.test.tsx` (co-located with source)
- E2E tests: `e2e/*.spec.ts`
- Smoke tests: `smoke/*.spec.ts`
- Page objects: `*.po.ts` (unit) or `pages/*.ts` (E2E/smoke)

---

## Folder Structure

```
src/test/
  setup.ts              # Global test setup
  mocks/                # Mock factories
  pages/                # Unit test page objects
  components/           # Component page objects
e2e/
  *.spec.ts             # E2E tests (convex-test backend)
  pages/                # E2E page objects
  fixtures.ts           # Auth and other fixtures
smoke/
  *.spec.ts             # Smoke tests (real backend)
  pages/                # Smoke page objects
  playwright.config.ts  # Smoke-specific config
```

---

## Config Locations

| Config             | Path                         |
| ------------------ | ---------------------------- |
| Vitest             | `vitest.config.ts`           |
| Playwright (E2E)   | `playwright.config.ts`       |
| Playwright (Smoke) | `smoke/playwright.config.ts` |
| Test setup         | `src/test/setup.ts`          |

---

## Sub-Documents

- [Unit Testing](./resources/unit-testing.md) - Vitest, Testing Library, mocking, async patterns
- [E2E Testing](./resources/e2e-testing.md) - Playwright + convex-test, fixtures, user flows
- [Smoke Testing](./resources/smoke-testing.md) - Real backend, critical paths, PR previews
- [Page Objects](./resources/page-objects.md) - Mandatory pattern for all test types
- [Anti-Patterns](./resources/anti-patterns.md) - Common mistakes to avoid

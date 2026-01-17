# Testing Strategy

React 19 + Vite + Convex art gallery testing approach.

## Test Stack

| Layer | Tool |
|-------|------|
| Unit/Component | Vitest + React Testing Library |
| E2E | Playwright |
| Convex backend | convex-test (in-memory) |

## Directory Structure

```
src/
  test/
    setup.ts           # Global vitest setup
    mocks/convex.ts    # Convex hook mocks
    fixtures/          # Sample data
  components/**/*.test.tsx
  lib/*.test.tsx
  pages/*.test.tsx
convex/__tests__/      # Backend function tests
e2e/                   # Playwright tests
  gallery.spec.ts
  admin.spec.ts
  contact.spec.ts
```

## Unit Testing

### What to Test

| Area | Focus |
|------|-------|
| Components | Rendering, interactions, props |
| Auth context | login/logout, sessionStorage |
| Forms | Validation, submit handlers |
| Convex functions | Queries, mutations (via convex-test) |

### Running Tests

```bash
bun run test          # Watch mode
bun run test:run      # Single run
bun run test:coverage # With coverage report
```

### Mocking Convex

Components using Convex hooks need mocks in tests:

```tsx
import { vi } from 'vitest'
import { useQuery, useMutation } from 'convex/react'

vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}))
```

### Testing Convex Functions

Use convex-test for backend function tests:

```ts
import { convexTest } from 'convex-test'
import { api } from '../_generated/api'
import schema from '../schema'

const t = convexTest(schema)

test('artwork query', async () => {
  const result = await t.query(api.artworks.list)
  expect(result).toBeDefined()
})
```

## E2E Testing

### Scenarios

- **Gallery**: Browse artworks, filter by series, lightbox interaction
- **Admin**: Login flow, CRUD operations on artworks/series
- **Contact**: Form submission

### Running E2E

```bash
bun run e2e      # Headless
bun run e2e:ui   # Interactive UI mode
```

### Mocking Convex API

Playwright intercepts Convex requests and returns fixture data:

```ts
await page.route('**/api/**', async route => {
  await route.fulfill({ json: fixtureData })
})
```

## Coverage

- Reports generated via `vitest run --coverage`
- No hard thresholds enforced
- Use reports to guide testing efforts

## CI/CD

GitHub Actions workflow runs:
1. Unit tests with coverage report
2. E2E tests with mocked Convex
3. Uploads Playwright artifacts on failure

See `.github/workflows/test.yml`

# Unit/Component Testing

Vitest + Testing Library conventions for fast, isolated tests.

---

## Query Priority

Prefer accessible queries in this order:

```ts
// Best - accessible by role
getByRole("button", { name: "Submit" });
getByRole("heading", { name: "Artworks" });
getByRole("textbox", { name: "Email" });

// Good - semantic
getByPlaceholderText("Search artworks...");
getByLabelText("Email address");

// Acceptable - content-based
getByText("No artworks found");

// Last resort - test ID
getByTestId("artwork-grid");
```

---

## Mocking Convex Hooks

Create mock factories for consistent test data:

```ts
// src/test/mocks/artworks.ts
export function createMockArtwork(overrides?: Partial<Artwork>): Artwork {
  return {
    _id: "artwork_123" as Id<"artworks">,
    title: "Test Artwork",
    year: 2024,
    ...overrides,
  };
}

// In test file
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

const mockUseQuery = vi.mocked(useQuery);
mockUseQuery.mockReturnValue([createMockArtwork()]);
```

---

## Async Patterns

```ts
// Setup userEvent at test start
const user = userEvent.setup();

// Prefer userEvent over fireEvent
await user.click(submitButton);
await user.type(input, "text");

// Wait for async updates
await waitFor(() => {
  expect(screen.getByText("Success")).toBeInTheDocument();
});

// Fake timers for debounce/throttle
vi.useFakeTimers();
await user.type(searchInput, "monet");
vi.advanceTimersByTime(300);
vi.useRealTimers();
```

---

## Nested Describe Pattern

```ts
describe("ArtworkCard", () => {
  describe("rendering", () => {
    it("displays title and year", () => {});
    it("shows placeholder when image loading", () => {});
  });

  describe("interactions", () => {
    it("navigates to detail on click", () => {});
    it("shows hover state", () => {});
  });
});
```

---

## Best Practices

- Test behavior, not implementation
- One assertion focus per test (multiple assertions OK if testing same behavior)
- Avoid testing internal state - test what user sees
- Use `screen` instead of destructuring from `render()`
- Clean up mocks in `beforeEach`/`afterEach`

---

## Common Queries

```ts
// By role (preferred)
getByRole("button", { name: "Submit" });
getByRole("heading", { level: 1 });
getByRole("link", { name: /learn more/i });
getByRole("textbox", { name: "Email" });

// By label
getByLabelText("Password");

// By placeholder
getByPlaceholderText("Search...");

// By text
getByText("No results");
getByText(/loading/i);

// Query variants
queryByRole(); // returns null if not found
findByRole(); // returns promise, waits for element
getAllByRole(); // returns array
```

---

## Common Assertions

```ts
// Visibility
expect(element).toBeVisible();
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Content
expect(element).toHaveTextContent("text");
expect(element).toHaveValue("input value");

// Attributes
expect(element).toHaveAttribute("href", "/path");
expect(element).toBeDisabled();
expect(element).toHaveClass("active");
```

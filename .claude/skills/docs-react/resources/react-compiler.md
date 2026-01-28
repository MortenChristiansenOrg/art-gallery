# React Compiler

Migration guide for adopting React Compiler and removing manual memoization.

---

## What React Compiler Does

- Automatically memoizes components and hooks
- Eliminates need for `useMemo`, `useCallback`, `React.memo`
- Enforces Rules of React at compile time
- Zero runtime overhead

---

## Installation

```bash
bun add -D babel-plugin-react-compiler
```

---

## Vite Configuration

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", {}]],
      },
    }),
  ],
});
```

---

## Migration: 4-Phase Rollout

### Phase 1: Setup

1. Install babel-plugin-react-compiler
2. Add to Vite config
3. Run build to check for errors
4. Fix any Rules of React violations flagged by compiler

### Phase 2: Audit Existing Code

Look for patterns that need cleanup:

```tsx
// Find these patterns
useMemo(() => ..., [deps])
useCallback(() => ..., [deps])
React.memo(Component)
memo(Component)
```

### Phase 3: Remove Manual Memoization

```tsx
// Before
const MemoizedCard = React.memo(function ArtworkCard({ artwork }) {
  return <div>{artwork.title}</div>;
});

function ParentComponent({ items }) {
  const sortedItems = useMemo(
    () => items.sort((a, b) => a.title.localeCompare(b.title)),
    [items]
  );

  const handleClick = useCallback((id) => {
    console.log("clicked", id);
  }, []);

  return sortedItems.map(item => (
    <MemoizedCard key={item.id} artwork={item} onClick={handleClick} />
  ));
}

// After (React Compiler handles memoization)
function ArtworkCard({ artwork }) {
  return <div>{artwork.title}</div>;
}

function ParentComponent({ items }) {
  const sortedItems = items.sort((a, b) => a.title.localeCompare(b.title));

  const handleClick = (id) => {
    console.log("clicked", id);
  };

  return sortedItems.map(item => (
    <ArtworkCard key={item.id} artwork={item} onClick={handleClick} />
  ));
}
```

### Phase 4: Verify

1. Run full test suite
2. Check React DevTools for unexpected re-renders
3. Profile performance to ensure no regressions

---

## What to Keep

### Keep useRef

`useRef` is for DOM refs and mutable values, not memoization:

```tsx
// Keep these
const inputRef = useRef<HTMLInputElement>(null);
const intervalRef = useRef<number | null>(null);

function focusInput() {
  inputRef.current?.focus();
}
```

### Keep useEffect Dependencies

Dependency arrays in `useEffect` are still required:

```tsx
// Keep deps array
useEffect(() => {
  document.title = `${count} items`;
}, [count]);
```

---

## Common Violations

React Compiler will error on Rules of React violations:

### Mutating During Render

```tsx
// ERROR - mutates props
function BadComponent({ items }) {
  items.push(newItem); // Compiler error
  return <List items={items} />;
}

// FIX
function GoodComponent({ items }) {
  const allItems = [...items, newItem];
  return <List items={allItems} />;
}
```

### Hooks in Conditions

```tsx
// ERROR - conditional hook
function BadComponent({ showData }) {
  if (showData) {
    const data = useQuery(api.data.get); // Compiler error
  }
}

// FIX
function GoodComponent({ showData }) {
  const data = useQuery(showData ? api.data.get : "skip");
}
```

### Side Effects During Render

```tsx
// ERROR - side effect in render
function BadComponent() {
  localStorage.setItem("visited", "true"); // Compiler error
  return <div>Hello</div>;
}

// FIX
function GoodComponent() {
  useEffect(() => {
    localStorage.setItem("visited", "true");
  }, []);
  return <div>Hello</div>;
}
```

---

## Opting Out (Escape Hatch)

For edge cases, use `"use no memo"` directive:

```tsx
function SpecialComponent() {
  "use no memo";
  // Compiler won't optimize this component
  return <div>...</div>;
}
```

Use sparingly. If you need this often, you likely have Rules of React violations.

---

## Migration Checklist

- [ ] Install babel-plugin-react-compiler
- [ ] Add to vite.config.ts
- [ ] Run build, fix any compiler errors
- [ ] Search and remove `useMemo` calls
- [ ] Search and remove `useCallback` calls
- [ ] Search and remove `React.memo` / `memo` wrappers
- [ ] Keep `useRef` for DOM refs
- [ ] Keep `useEffect` dependency arrays
- [ ] Run tests
- [ ] Profile performance

---

## Files to Update

Based on codebase audit:

| File | Changes |
|------|---------|
| `vite.config.ts` | Add compiler plugin |
| `src/components/*.tsx` | Remove memo wrappers |
| `src/features/**/*.tsx` | Remove useMemo/useCallback |
| `src/hooks/*.ts` | Remove useCallback in returns |

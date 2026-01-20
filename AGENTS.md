# Agents

The .context folder is ignored by git. Use it to store any temporary files you use yo keep track of your work.

**Commands:**

- `bun run test` - unit tests (watch)
- `bun run test:run` - unit tests (single run)
- `bun run e2e` - Playwright E2E tests

## Specifications

The `specs/` folder is the source of truth for feature requirements. Each spec defines:

- Implementation file references
- User flows
- Interactions
- Test status

**Structure:**

```
specs/
├── _index.yaml       # Auto-generated index
├── _dictionary.yaml  # Core terms
├── gallery/          # Public gallery features
├── admin/            # Admin panel features
└── contact/          # Contact form features
```

**Commands:**

- `bun run spec:validate` - validate all specs
- `bun run spec:index` - regenerate index

**Skills:**

- `/spec-validate` - validate spec format
- `/spec-create` - create new spec interactively
- `/spec-index` - regenerate index
- `/spec-query tag:X` - find specs by tag, status, or file ref

**Feature Development Workflow:**

⚠️ **SPEC FIRST** - Never start implementing without a spec.

1. Create/update spec BEFORE writing any code (`/spec-create` or edit existing)
2. Define flows, interactions, implementation refs in spec
3. Get spec approved if working with others
4. Implement according to spec
5. Update spec status and test refs as you go
6. Run `/spec-index` after changes

## Testing

All functionality must be verified with tests. See `docs/testing.md` for full strategy.
After adding or changing functionality, make sure the changes are covered by passing tests.

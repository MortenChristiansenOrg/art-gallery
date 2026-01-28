# Environment

The shell environment is zsh on WSL2 (Ubuntu).
Available scripting environments:

- zsh
- Node

# Documentation

See this file (AGENTS.md) and README.md for system conventions. Skills in `.claude/skills/` provide domain-specific guidance.

# Commands

Use bun commands instead of npm commands.

Install dependencies: `bun install`

Run unit/component tests: `bun run test:run`
Run E2E tests: `bun run e2e`
Run E2E with Playwright UI: `bun run e2e:ui`
Run smoke tests: `bun run smoke`

Initialize Convex: `bunx convex dev`
Note: Never run this command unless asked directly (is user managed)

Run dev server: `bun run dev`
Note: Never run this command unless asked directly (is user managed)

Update Convex functions: `bunx convex deploy`
Note: Run this after every change to Convex functions

## Work

When implementing work, create tasks and delegate to sub agents where it makes sense.
Always make sure the code compiles and tests pass.
The production Convex instance has data in it, so always ensure that changes to the schema will not cause data loss or corruption.
Always specify types and never use `any`.

## Testing

All functionality must be verified with tests.
After adding or changing functionality, make sure the changes are covered by passing tests.

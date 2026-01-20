---
name: spec-implement
description: Implement a planned spec from specs/ folder. Use when user says /spec-implement or wants to implement a specification. Finds specs with status=planned and guides implementation.
---

# Spec Implement

Implements a planned spec end-to-end with tests.

## Prerequisites

Check `specs/_index.yaml` for specs with `status: planned`. If none found, inform user and **stop**.

## Workflow

### 1. Select Spec

If multiple planned specs exist, ask user which to implement. Display id, title, description for each.

### 2. Resolve Unresolved Questions

Read the spec file. If `## Unresolved Questions` section exists (or similar), ask user for each question with suggested options to choose from.

### 3. Clean Context

Run `scripts/clean-context.sh` to clear `.context/` directory.

```bash
bash .claude/skills/spec-implement/scripts/clean-context.sh
```

### 4. Implement

Follow the spec's flows, interactions, and requirements:

- Create/modify implementation files
- Reference spec's `implementation:` section for target locations
- Reference docs/design-system.md for frontend design
- Mark implementation refs with actual file:line or file#export

### 5. Write Tests

- Unit tests for each component/function
- **E2E tests required**: At least one E2E test per user flow defined in spec
- Reference spec's `verification:` section for test paths
- Use existing test patterns in the codebase (refer to docs/testing.md)

### 6. Run Tests

Run full test suite. Fix failures until all pass:

```bash
bun test        # unit tests
bun test:e2e    # e2e tests
```

### 7. Update Spec

Update the spec file:

- Set `status: implemented` (or `partial` if incomplete)
- Fill `implementation:` refs with actual file paths
- Update `verification:` test paths and set `status: implemented`

### 8. Regenerate Index

Run `/spec-validate` (and fix any errors)
Run `/spec-index`

### 9. Retrospective

Create `.context/retrospective.md` reflecting on:

- Are there any parts of the implementation that seem likely to cause problems?
- Skill improvement suggestions (only broadly useful ones)
- New skill ideas for future automation (only broadly useful ones)
- Opportunities for scripted checks/tasks (only broadly useful ones)

For each potential thing to change about the implementation or the skills, present the user with an option to make the change.

# Branching Strategy

Trunk-based development with continuous deployment.

## Overview

Single-branch model optimized for:

- Fast iteration (every merge deploys)
- Quality gates at PR level
- AI-assisted development with automated checks

## Branch Model

| Branch      | Purpose                           |
| ----------- | --------------------------------- |
| `main`      | Production, auto-deploys on merge |
| `feature/*` | Optional, for larger work         |

### Rules

- No direct pushes to main
- All changes via PR
- Every merge triggers production deploy
- Feature branches for multi-commit work

## Quality Gates

### Pre-commit Hooks

Every commit must pass before being accepted:

```bash
# Runs automatically via husky/lint-staged
bun run test:run      # All unit tests
bun run spec:validate # Spec format validation
```

**Rationale:** Safety over speed. Catching issues at commit time prevents broken builds and reduces PR churn.

### PR Requirements

Before merging to main:

| Gate                  | Enforcement       |
| --------------------- | ----------------- |
| Vercel Preview Deploy | Auto per PR       |
| CodeRabbit review     | Auto-triggered    |
| Unit tests pass       | CI required check |
| E2E tests pass        | CI required check |

**PR Checklist:**

- [ ] All CI checks green
- [ ] CodeRabbit review addressed
- [ ] Preview deploy tested
- [ ] No spec status regressions

### Post-merge

- Auto-deploy to production via Vercel
- Monitor for errors post-deploy

## Commit Guidelines

### Unit of Work

One commit should represent:

- Spec file (created or updated)
- Implementation matching spec
- Tests covering implementation

### Commit Message Format

```
<type>: <summary>

Spec: specs/<category>/<spec-file>.yaml
```

**Types:** feat, fix, refactor, test, docs, chore

**Example:**

```
feat: add lightbox zoom controls

Spec: specs/gallery/lightbox.yaml
```

## Workflow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  Local Development                                           │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  Pre-commit Hook                                             │
│  ├── bun run test:run (all unit tests)                       │
│  └── bun run spec:validate (spec validation)                 │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  PR to main                                                  │
│  ├── Vercel Preview Deploy (auto)                            │
│  ├── CodeRabbit review (auto)                                │
│  ├── Unit + E2E tests (CI)                                   │
│  └── Preview URL verified                                    │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │  Merge to    │
                      │    main      │
                      └──────────────┘
                              │
                              ▼
                  ┌────────────────────┐
                  │   Auto-deploy to   │
                  │    production      │
                  └────────────────────┘
```

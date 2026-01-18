# Feature Development Process

AI-assisted, skill-driven development workflow.

## Overview

Development governed by skills that orchestrate:

- Work item selection and prioritization
- Spec-first implementation
- Automated code and security reviews
- PR creation with quality gates

## Prerequisites

| Requirement       | Purpose                   |
| ----------------- | ------------------------- |
| GitHub MCP or CLI | Fetch/manage work items   |
| Specs framework   | Define work before coding |
| Pre-commit hooks  | Quality enforcement       |

## Work Item Types

| Type          | Tag            | Description        |
| ------------- | -------------- | ------------------ |
| Feature       | `feature`      | New functionality  |
| Bug           | `bug`          | Defect fix         |
| Documentation | `doc`          | Docs update        |
| Refactor      | `refactor`     | Code improvement   |
| Architecture  | `architecture` | Structural changes |

## Workflow Phases

### 1. Prepare (`/work-prepare`)

Sets up work context and creates spec.

| Step                 | Action                                                      |
| -------------------- | ----------------------------------------------------------- |
| Reset context folder | Delete all files and folders in the .context folder         |
| Fetch stories        | Get available work items from GitHub                        |
| Select item          | Priority-based or specified ID                              |
| Check dependencies   | Identify blocking stories                                   |
| Create branch        | Format: `{id}-{description}` (e.g., `431-add-welcome-page`) |
| Create/update spec   | Define implementation details                               |
| Get approval         | Human checkpoint                                            |

**Optional argument:** Work item ID to start specific task.

### 2. Implement (`/work-start`)

Build according to approved spec and use .context folder for temporary scratch pad.

| Step            | Action                            |
| --------------- | --------------------------------- |
| Implement       | Code according to spec            |
| Test            | Ensure tests pass                 |
| Code review     | Invoke review skill, fix issues   |
| Security review | Invoke security skill, fix issues |
| Self-improve    | Update skills based on learnings  |

### 3. Complete (`/work-complete`)

Finalize and submit for review.

| Step      | Action                              |
| --------- | ----------------------------------- |
| Commit    | Stage and commit (pre-commit hooks) |
| Push      | Push to remote                      |
| Create PR | Against main branch                 |

CodeRabbit auto-assigned for review.

### 4. Handle Feedback (`/work-handle-pr-comments`)

Process review comments.

| Step     | Action                      |
| -------- | --------------------------- |
| Retrieve | Fetch CodeRabbit comments   |
| Assess   | Determine which need fixing |
| Fix      | Address necessary issues    |
| Resolve  | Mark non-issues as resolved |

## Human Checkpoints

| Checkpoint      | When                   | Decision                    |
| --------------- | ---------------------- | --------------------------- |
| Spec approval   | After `/work-prepare`  | Approve implementation plan |
| PR verification | After `/work-complete` | Review preview deploy       |
| Merge           | When PR green          | Merge to main               |

## Workflow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  /work-prepare                                               │
│  ├── Fetch stories from GitHub                               │
│  ├── Select priority or specified item                       │
│  ├── Create branch: {id}-{description}                       │
│  └── Create/update spec                                      │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  Human: Spec   │
                     │   Approval     │
                     └────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  /work-start                                                 │
│  ├── Implement according to spec                             │
│  ├── Ensure tests pass                                       │
│  ├── Code review skill → fix issues                          │
│  ├── Security review skill → fix issues                      │
│  └── Self-review → update skills                             │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  /work-complete                                              │
│  ├── Commit + push (pre-commit hooks)                        │
│  └── Create PR against main                                  │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  Human: PR +   │
                     │  Preview Check │
                     └────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                              ▼
┌──────────────────────┐         ┌────────────────────┐
│  /work-handle-pr-    │         │  Human: Merge      │
│  comments            │         │  Decision          │
│  ├── Fetch comments  │         └────────────────────┘
│  ├── Fix issues      │                   │
│  └── Resolve rest    │                   ▼
└──────────────────────┘         ┌────────────────────┐
         │                       │  Auto-deploy to    │
         └───────────────────────│  production        │
                                 └────────────────────┘
```

## Related Docs

- [Branching Strategy](./branching-strategy.md) - Pipeline and deployment details
- [Specs Framework](../specs/README.md) - Spec file format and validation

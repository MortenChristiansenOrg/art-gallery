---
name: code-review
description: Performs comprehensive code review of uncommitted files. Use with /code-review or when user asks to review their changes.
invocation: user
---

# Goal

Review all uncommitted changes across multiple dimensions using specialized sub-agents.

## Workflow

1. Create tasks for each review dimension
2. Launch sub-agents to handle each task in parallel
3. Collect and summarize findings

## Review Dimensions

Each dimension is handled by its own sub-agent:

| Dimension       | Focus                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------- |
| Code Quality    | Patterns from docs-react, docs-design-system. Readability, maintainability, architecture |
| Test Coverage   | Per docs-testing. Missing tests, test quality, coverage gaps                             |
| Security        | Injection, XSS, auth issues, secrets exposure, OWASP top 10                              |
| Performance     | Unnecessary renders, bundle size, lazy loading                                           |
| UX              | Accessibility, loading states, error handling, responsive design                         |
| Task Completion | Does the code actually solve the intended task? Edge cases covered?                      |

## Instructions

When invoked:

1. **Get uncommitted changes**

   ```bash
   git diff HEAD
   git status
   ```

2. **Create task list** using TaskCreate for each review dimension

3. **Launch parallel sub-agents** using the Task tool with subagent_type="general-purpose" for each dimension:

   For each task, spawn an agent with prompt like:

   ```
   Review uncommitted changes for [DIMENSION].

   Context:
   - Use `git diff HEAD` to see changes
   - Reference docs-* skills where applicable
   - Focus only on [DIMENSION] aspects

   Output a markdown section with:
   - Summary (1-2 sentences)
   - Issues found (bullet list, empty if none)
   - Recommendations (bullet list, empty if none)

   Be concise. Only report actual issues.
   ```

4. **Collect results** and compile into unified report

5. **Mark tasks complete** as each agent finishes

## Output Format

```markdown
# Code Review Summary

## Overview

[1-2 sentence summary of changes]

## Code Quality

[Agent findings]

## Test Coverage

[Agent findings]

## Security

[Agent findings]

## Performance

[Agent findings]

## UX

[Agent findings]

## Task Completion

[Agent findings]

## Action Items

- [ ] Critical: ...
- [ ] Important: ...
- [ ] Minor: ...
```

## Notes

- Skip dimensions not relevant to the changes (e.g., skip UX for backend-only changes)
- Reference specific file:line when reporting issues
- Use docs-testing for test coverage standards
- Use docs-react for React patterns
- Use docs-design-system for styling/UI patterns

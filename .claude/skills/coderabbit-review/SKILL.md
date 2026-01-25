---
name: coderabbit-review
description: Handle CodeRabbit PR review comments - triage, fix, commit, resolve threads. Use with /coderabbit-review or /coderabbit-review <PR_NUMBER>.
invocation: user
---

# Goal

Process CodeRabbit review comments on a PR: read comments, triage by priority, apply fixes, commit changes, and resolve addressed threads.

## Invocation

- `/coderabbit-review` - Uses current branch's PR
- `/coderabbit-review <PR_NUMBER>` - Specific PR

## Prerequisites

Requires `gh` CLI with a fine-grained PAT. Setup:

1. Create token at https://github.com/settings/personal-access-tokens/new
2. Select repository access (this repo or all)
3. Permissions: **Pull requests → Read and write**
4. Add to `.env.local`: `GH_TOKEN=ghp_xxx`

The `GH_TOKEN` env var is automatically used by `gh`.

## Workflow

### 1. Identify PR

If no PR number provided:

```bash
gh pr view --json number -q '.number'
```

Get repo info:

```bash
gh repo view --json owner,name -q '"\(.owner.login) \(.name)"'
```

### 2. Fetch Review Threads

```bash
.claude/skills/coderabbit-review/scripts/fetch-review-threads.sh <owner> <repo> <pr_number>
```

Returns JSON array of threads with:

- `threadId` (RT_xxx) - for resolving
- `commentId` - for replying
- `path` - file path
- `line` - line number
- `body` - comment content (includes collapsed HTML for nitpicks)
- `isResolved` - skip if true

### 3. Triage Comments

Categorize by CodeRabbit markers:

| Marker                      | Priority | Action              |
| --------------------------- | -------- | ------------------- |
| `**Security**` / `**Bug**`  | High     | Must address        |
| `**Suggestion**`            | Medium   | Evaluate merit      |
| `**Nitpick**` / `[nitpick]` | Low      | Auto-fix if trivial |

**Handling incorrect/irrelevant comments:**

- Some comments may be wrong or based on misunderstanding the code
- If a comment doesn't apply, reply to teach CodeRabbit:
  ```bash
  .claude/skills/coderabbit-review/scripts/reply-to-comment.sh <owner> <repo> <pr> <comment_id> "@coderabbitai <explanation>"
  ```
- Then resolve the thread

**Nitpick rules:**

- Auto-fix: formatting, naming conventions, simple type annotations, import ordering
- Ask user: debatable style choices, subjective preferences

### 4. Apply Fixes

Group fixes by logical area:

- One commit per major fix
- Group similar small changes into single commit
- Use descriptive commit messages referencing the fix
- Generate tasks for the different fixes and implement them using sub agents

### 5. Push Changes

Single `git push` after all commits.

### 6. Resolve Threads

After push succeeds, resolve each addressed thread:

```bash
.claude/skills/coderabbit-review/scripts/resolve-thread.sh <thread_id>
```

## Output Format

```markdown
# CodeRabbit Review: PR #XXX

## Summary

[X comments triaged: Y high, Z medium, W low]

## Actions Taken

### Fixed

- [file:line] Brief description of fix

### Skipped (incorrect/irrelevant)

- [file:line] Reason + reply sent

### Needs Discussion

- [file:line] Why user input needed

## Commits Made

- abc1234: Commit message

## Threads Resolved

- RT_xxx, RT_yyy, ...
```

## Error Handling

- If `gh` not authenticated: prompt user to run `gh auth login`
- If PR not found: show error and exit
- If push fails: do NOT resolve threads, report error
- If thread resolution fails: continue with others, report failures

## Scripts Reference

| Script                    | Purpose            | Args                                      |
| ------------------------- | ------------------ | ----------------------------------------- |
| `fetch-review-threads.sh` | Get all threads    | `<owner> <repo> <pr>`                     |
| `resolve-thread.sh`       | Resolve one thread | `<thread_id>`                             |
| `reply-to-comment.sh`     | Reply to comment   | `<owner> <repo> <pr> <comment_id> <body>` |

See `.claude/skills/coderabbit-review/resources/api-commands.md` for raw gh API commands.

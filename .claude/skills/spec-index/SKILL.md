---
name: spec-index
description: Regenerate the specs/_index.yaml from all spec files. Use when user says /spec-index or after creating/modifying specs.
---

# Spec Index

Regenerates `specs/_index.yaml` from all spec files.

## Usage

```
/spec-index
```

## Process

Run `bun run spec:index`

This scans `specs/**/*.yaml` (excluding _index.yaml, _dictionary.yaml) and:
1. Extracts id, path, title, tags, status
2. Builds by_tag reverse index
3. Writes to `specs/_index.yaml` with timestamp

## Output

```
✓ Generated index with 8 specs
  Tags: gallery, public, core, admin, crud, content, security, contact
```

## When to Run

- After creating new specs
- After modifying spec metadata (id, title, tags, status)
- Before committing spec changes

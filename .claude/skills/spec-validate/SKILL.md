---
name: spec-validate
description: Validate spec files for correct YAML format, required fields, and file references. Use when user says /spec-validate or asks to validate specs.
---

# Spec Validate

Validates spec files in the `specs/` folder.

## Usage

- `/spec-validate` - validate all specs
- `/spec-validate specs/path/to/file.yaml` - validate single file

## Validation

Run `bun run spec:validate` to check all specs.

For single file validation, check manually:

1. **YAML syntax** - parseable
2. **Required fields**: id, title, tags, status, description, implementation, flows, interactions
3. **Valid status**: implemented | partial | planned
4. **Implementation refs** exist (file#export format, check file path)
5. **Test refs** with status=implemented must have existing files

## Output

```
✓ All 8 specs valid
```

Or list errors:

```
✗ specs/gallery/artwork-browsing.yaml
  - Missing required field: flows
  - Implementation file not found: src/missing.tsx
```

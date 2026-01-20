---
name: spec-requirement
description: Add or update a requirement across one or more specs. Use when user says /spec-requirement or wants to add/modify requirements that affect specifications.
---

# Spec Requirement

Adds or updates requirements across relevant specs.

## Usage

- `/spec-requirement <requirement description>` - find specs and add requirement
- `/spec-requirement <spec-id> <requirement>` - add to specific spec

## Workflow

### 1. Parse Input

Extract the requirement description. If spec-id provided, skip to step 3.

### 2. Find Relevant Specs

Search for specs that should include this requirement:

1. Read `specs/_index.yaml` for spec list
2. Search spec descriptions, flows, and existing requirements for keyword matches
3. Consider tags and categories that align with the requirement

Present matching specs to user:

```
Found 2 specs that may relate to "images must have alt text":

1. artwork-browsing (specs/gallery/artwork-browsing.yaml)
   Artwork viewing and gallery display

2. image-delivery (specs/gallery/image-delivery.yaml)
   Image optimization and delivery

Select specs to update (comma-separated numbers, or 'all'):
```

### 3. Handle No Matches

If no relevant specs found:

```
No specs found matching this requirement.

Options:
- Provide a spec id: /spec-requirement <spec-id> <requirement>
- Create a new spec: /spec-create
```

**Stop and wait for user input.**

### 4. Clarify & Suggest Alternatives

Before updating specs, consider:

1. **Ambiguities** - Are there unclear aspects of the requirement?
2. **Edge cases** - What happens in boundary conditions?
3. **Alternative approaches** - Are there better ways to solve this?
4. **Trade-offs** - What are the pros/cons of different implementations?

If you have questions or suggestions, present them:

```
Before adding this requirement, a few questions:

1. Should reordering be per-series or global? (or both?)
2. Consider: drag-drop vs arrow buttons - drag is more intuitive but harder to implement

Want me to proceed with [assumption], or clarify?
```

**Stop and wait for user input if there are meaningful questions.**

Skip this step if the requirement is straightforward and unambiguous.

### 5. Update Specs

For each selected spec:

1. Read the spec file
2. Add requirement to `requirements:` section
3. If `requirements:` doesn't exist, add it after `interactions:`
4. Avoid duplicates - check if similar requirement exists
5. Make sure all sections of spec are filled out correctly according to the new requirements
6. Mark spec state as planned

### 6. Verify

Run /spec-validate to verify changes and fix any problems.
Run /spec-index to reindex the spec files.

### 7. Confirm Changes

```
Updated 2 specs:
✓ artwork-browsing - added requirement
✓ image-delivery - added requirement
```

## Examples

```
/spec-requirement All admin pages require authentication
→ Finds admin-tagged specs, adds auth requirement

/spec-requirement artwork-management Soft delete instead of hard delete
→ Adds directly to artwork-management spec

/spec-requirement Images must lazy load on scroll
→ Searches, finds image-delivery spec, confirms with user
```

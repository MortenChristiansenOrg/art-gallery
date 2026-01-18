---
name: spec-create
description: Create a new spec file interactively. Use when user says /spec-create or wants to create/add a new specification.
---

# Spec Create

Creates a new spec file with guided prompts.

## Workflow

1. Use look at the specs/\_index.yaml file to find existing specs that might overlap and suggest updating them instead if any are found.
1. Ask for spec **id** (kebab-case, e.g., "user-profile")
1. Ask for **title** (e.g., "User Profile")
1. Ask for **category** folder (gallery | admin | contact | new folder name)
1. Ask for **tags** (suggest: gallery, admin, contact, public, core, security, crud, content)
1. Ask for brief **description**
1. Suggest up to 3 adjustments or additional features to include in the spec

## Template

Create at `specs/<category>/<id>.yaml`:

```yaml
id: <id>
title: <title>
tags: [<tags>]
status: planned

description: |
  <description>

implementation:
  -  # Add file:line or file#export refs

verification:
  unit:
    - path: # test file path
      status: planned
  e2e:
    - path: # e2e test path (MUST include at least 1 E2E test covering each flow)
      status: planned

flows:
  main:
    - Step 1
    - Step 2

interactions:
  - type: click
    element: element-name
    action: What happens

requirements:
  -  # Add requirements not described in flows
```

## After Creation

1. Fill implementation refs pointing to actual code
2. Define flows for each user journey
3. Add interaction points
4. Run `/spec-validate` to check for correctness
5. Run `/spec-query` to find related specs and make sure they are consistent and do not overlap
6. Run `/spec-index` to update index

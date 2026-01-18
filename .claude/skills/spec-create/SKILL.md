---
name: spec-create
description: Create a new spec file interactively. Use when user says /spec-create or wants to create/add a new specification.
---

# Spec Create

Creates a new spec file with guided prompts.

## Workflow

1. Ask for spec **id** (kebab-case, e.g., "user-profile")
2. Ask for **title** (e.g., "User Profile")
3. Ask for **category** folder (gallery | admin | contact | new folder name)
4. Ask for **tags** (suggest: gallery, admin, contact, public, core, security, crud, content)
5. Ask for brief **description**

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
  - # Add file:line or file#export refs

verification:
  unit:
    - path: # test file path
      status: planned
  e2e:
    - path: # e2e test path
      status: planned

flows:
  main:
    - Step 1
    - Step 2

interactions:
  - type: click
    element: element-name
    action: What happens
```

## After Creation

Remind user to:
1. Fill implementation refs pointing to actual code
2. Define flows for each user journey
3. Add interaction points
4. Run `/spec-index` to update index

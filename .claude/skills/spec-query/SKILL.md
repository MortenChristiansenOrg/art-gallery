---
name: spec-query
description: Query specs by tag, status, search term, or file reference. Use when user says /spec-query or wants to find/search specs.
---

# Spec Query

Query specs by various criteria.

## Usage

- `/spec-query tag:<tag>` - specs with tag
- `/spec-query status:<status>` - by status (implemented | partial | planned)
- `/spec-query search:<term>` - full-text search
- `/spec-query file:<filename>` - specs referencing file

## Process

1. Read `specs/_index.yaml` for tag/status lookups
2. For file/search queries, grep through spec content
3. Return matching specs with path, description excerpt, tags, status

## Output Format

```
Found 3 specs matching tag:admin:

1. admin-auth (specs/admin/authentication.yaml)
   Password-based admin authentication
   Status: implemented | Tags: admin, security, core

2. artwork-management (specs/admin/artwork-management.yaml)
   CRUD operations for artworks
   Status: implemented | Tags: admin, crud
```

## Examples

```
/spec-query tag:gallery
→ artwork-browsing, series-filtering

/spec-query status:planned
→ (lists specs with status: planned)

/spec-query file:ArtworkGrid
→ artwork-browsing (refs src/components/gallery/ArtworkGrid.tsx)

/spec-query search:lightbox
→ artwork-browsing (mentions lightbox)
```

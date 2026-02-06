---
name: docs-convex
description: Convex backend best practices reference. Use when writing queries, mutations, actions, schema, scheduling, file storage, or any Convex server-side code. Covers validators, indexes, error handling, the action/mutation pipeline, and common anti-patterns.
---

# Convex Best Practices Reference

Canonical guide for Convex backend development in this project.

---

## Function Types

| Type | Purpose | Context | Side Effects | Deterministic |
|------|---------|---------|--------------|---------------|
| Query | Read data, reactive subscriptions | `ctx.db` (read), `ctx.storage`, `ctx.auth` | None | Yes |
| Mutation | Write data, transactional | `ctx.db` (read+write), `ctx.storage`, `ctx.auth`, `ctx.scheduler` | DB writes, scheduling | Yes |
| Action | External APIs, heavy compute | `ctx.runQuery`, `ctx.runMutation`, `ctx.storage`, `ctx.scheduler` | Any | No |
| HTTP Action | Webhooks, custom endpoints | Same as action + raw `Request`/`Response` | Any | No |

**Key rules:**
- Queries/mutations: no `fetch()`, no external APIs, no `Math.random()`
- Actions: no direct `ctx.db` access — use `ctx.runQuery`/`ctx.runMutation`
- Mutations are fully transactional (OCC with auto-retry)
- `"use node"` files can ONLY contain actions (no queries/mutations)

---

## Schema & Validators

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  artworks: defineTable({
    title: v.string(),
    year: v.optional(v.number()),
    imageId: v.id("_storage"),
    status: v.union(v.literal("draft"), v.literal("published")),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_status", ["status"])
    .index("by_year", ["year"]),
});
```

### Validator Quick Reference

| Validator | TypeScript | Notes |
|-----------|-----------|-------|
| `v.string()` | `string` | |
| `v.number()` | `number` | |
| `v.boolean()` | `boolean` | |
| `v.id("table")` | `Id<"table">` | Foreign key |
| `v.optional(v.X())` | `X \| undefined` | |
| `v.union(v.literal("a"), v.literal("b"))` | `"a" \| "b"` | Enum-like |
| `v.array(v.X())` | `X[]` | |
| `v.object({...})` | `{...}` | |
| `v.record(v.string(), v.X())` | `Record<string, X>` | |
| `v.null()` | `null` | Use instead of `undefined` |
| `v.any()` | `any` | Avoid |

### Validator Composition (newer API)

```typescript
const userValidator = v.object({ name: v.string(), email: v.string() });
userValidator.pick("name");     // { name: string }
userValidator.omit("email");    // { name: string }
userValidator.partial();        // all optional
userValidator.extend({ age: v.number() });
```

### Type Extraction

```typescript
import { Infer } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

type User = Infer<typeof userValidator>;
type Artwork = Doc<"artworks">;       // full doc with _id, _creationTime
type ArtworkId = Id<"artworks">;
```

---

## Index Best Practices

- Define index for every query pattern that filters/sorts
- `.withIndex()` over `.filter()` — filter scans everything, index doesn't
- Compound indexes: eq fields first, then range bounds
- `_creationTime` implicitly appended to every index
- Redundant: `by_foo` + `by_foo_and_bar` → keep only compound

```typescript
// GOOD — index-driven
const msgs = await ctx.db.query("messages")
  .withIndex("by_channel", q => q.eq("channel", channelId))
  .order("desc")
  .take(50);

// OK — post-index filter for non-indexed fields
const msgs = await ctx.db.query("messages")
  .withIndex("by_channel", q => q.eq("channel", channelId))
  .filter(q => q.neq(q.field("author"), excludeId))
  .take(50);

// BAD — full table scan
const msgs = await ctx.db.query("messages")
  .filter(q => q.eq(q.field("channel"), channelId))
  .collect();
```

---

## Data Reading

| Method | Use When |
|--------|----------|
| `.first()` | Need one result |
| `.unique()` | Expect exactly one (throws if multiple) |
| `.take(n)` | Known max count |
| `.collect()` | Small result sets (<1000 docs) |
| `.paginate()` | Large/unbounded results |

**Never** `.collect()` on large tables without index narrowing.

---

## Action-Mutation Pipeline

Actions do work, mutations do state transitions. This is the core architectural pattern.

```
Frontend → Mutation (set state + schedule) → Action (do work) → Mutation (save result)
```

See [Action-Mutation Pipeline](./references/action-mutation-pipeline.md) for detailed patterns.

---

## File Storage

```typescript
// Generate upload URL (mutation)
const url = await ctx.storage.generateUploadUrl();

// Get download URL (query/mutation)
const url = await ctx.storage.getUrl(storageId); // string | null

// Store blob (action)
const id = await ctx.storage.store(new Blob([buffer], { type: "image/jpeg" }));

// Delete (mutation)
await ctx.storage.delete(storageId);
```

Storage IDs: `v.id("_storage")`

---

## Scheduling

```typescript
// From mutation (atomic with transaction)
await ctx.scheduler.runAfter(0, internal.actions.process, { id });
await ctx.scheduler.runAfter(5000, internal.cleanup.run, {});
await ctx.scheduler.runAt(timestamp, internal.jobs.send, {});
await ctx.scheduler.cancel(scheduledFnId);
```

Auth context NOT propagated — pass user data explicitly.

### Cron Jobs

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
const crons = cronJobs();
crons.interval("check stuck", { minutes: 5 }, internal.processing.checkStuck);
crons.cron("daily report", "0 9 * * *", internal.reports.daily); // UTC
export default crons;
```

---

## Error Handling

```typescript
import { ConvexError } from "convex/values";

// Application error (data preserved in production)
throw new ConvexError("Not found");
throw new ConvexError({ code: "FORBIDDEN", message: "No access" });

// Regular errors are redacted in production to "Server Error"
throw new Error("Something broke"); // client sees generic message
```

Client-side:
```typescript
try { await doMutation(args); }
catch (e) {
  if (e instanceof ConvexError) console.log(e.data); // your payload
}
```

---

## Quick Reference

| Topic | Resource |
|-------|----------|
| Action/mutation pipeline | [Action-Mutation Pipeline](./references/action-mutation-pipeline.md) |
| Schema & relationships | [Schema Patterns](./references/schema-patterns.md) |
| Auth patterns | [Authentication](./references/authentication.md) |
| HTTP actions | [HTTP Actions](./references/http-actions.md) |
| Anti-patterns | [Anti-Patterns](./references/anti-patterns.md) |

---

## Sub-Documents

- [Action-Mutation Pipeline](./references/action-mutation-pipeline.md) - Scheduling, callbacks, state machines, retry
- [Schema Patterns](./references/schema-patterns.md) - Relationships, indexes, pagination, type safety
- [Authentication](./references/authentication.md) - Auth checking, middleware, RBAC
- [HTTP Actions](./references/http-actions.md) - Custom endpoints, webhooks, CORS
- [Anti-Patterns](./references/anti-patterns.md) - Common mistakes to avoid

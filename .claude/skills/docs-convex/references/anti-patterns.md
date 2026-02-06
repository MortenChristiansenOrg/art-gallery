# Anti-Patterns

Common Convex mistakes to avoid.

---

## Not Awaiting Promises

```typescript
// BAD — fire and forget, silent failures
ctx.db.patch(id, { status: "done" });
ctx.scheduler.runAfter(0, internal.actions.process, { id });

// GOOD — always await
await ctx.db.patch(id, { status: "done" });
await ctx.scheduler.runAfter(0, internal.actions.process, { id });
```

Enable `no-floating-promises` ESLint rule.

---

## .filter() Without Index

```typescript
// BAD — full table scan
const msgs = await ctx.db.query("messages")
  .filter(q => q.eq(q.field("channel"), channelId))
  .collect();

// GOOD — index-driven
const msgs = await ctx.db.query("messages")
  .withIndex("by_channel", q => q.eq("channel", channelId))
  .collect();
```

---

## .collect() on Large Tables

```typescript
// BAD — loads entire table into memory
const allUsers = await ctx.db.query("users").collect();

// GOOD — use pagination or take
const page = await ctx.db.query("users").paginate(paginationOpts);
const recent = await ctx.db.query("users").order("desc").take(50);
```

---

## Date.now() in Queries

```typescript
// BAD — subscription never re-fires when time passes
export const getRecent = query({
  handler: async (ctx) => {
    const cutoff = Date.now() - 60000; // stale after first call
    return ctx.db.query("events")
      .filter(q => q.gt(q.field("time"), cutoff))
      .collect();
  },
});

// GOOD — pass time from client, or use scheduled mutation to flip a flag
export const getRecent = query({
  args: { since: v.number() },
  handler: async (ctx, args) => {
    return ctx.db.query("events")
      .withIndex("by_time", q => q.gt("time", args.since))
      .collect();
  },
});
```

---

## Multiple Sequential ctx.runQuery/ctx.runMutation in Actions

```typescript
// BAD — no consistency between calls
const user = await ctx.runQuery(internal.users.get, { id: userId });
const posts = await ctx.runQuery(internal.posts.byAuthor, { authorId: userId });
// user and posts may be from different snapshots

// GOOD — combine into single query
const data = await ctx.runQuery(internal.users.getWithPosts, { id: userId });
```

---

## Using api.* for Internal Calls

```typescript
// BAD — exposes function publicly, skips internal-only protection
await ctx.scheduler.runAfter(0, api.processing.doWork, { id });

// GOOD — internal functions for server-to-server
await ctx.scheduler.runAfter(0, internal.processing.doWork, { id });
```

---

## Mixing Function Types in "use node" Files

```typescript
// BAD — queries/mutations in "use node" file
"use node";
export const getData = query({ ... }); // ERROR: won't work

// GOOD — only actions in "use node" files
"use node";
export const processImage = internalAction({ ... });
```

Also: non-"use node" files must NOT import from "use node" files.

---

## Importing "use node" Files from Regular Files

```typescript
// BAD — in a non-node file
import { helper } from "./nodeUtils"; // nodeUtils has "use node"

// GOOD — keep shared helpers in separate non-node file
// Or use ctx.runAction to cross runtimes
```

---

## Client-Side Mutation Loops

```typescript
// BAD — N network round trips
for (const item of items) {
  await updateItem({ id: item.id, status: "done" });
}

// GOOD — single mutation handles batch
await batchUpdateItems({ ids: items.map(i => i.id), status: "done" });
```

---

## undefined as Convex Value

```typescript
// BAD — undefined silently stripped from objects
await ctx.db.insert("items", { name: "test", description: undefined });
// description field won't exist in document

// GOOD — use null explicitly
await ctx.db.insert("items", { name: "test", description: null });
```

---

## Redundant Indexes

```typescript
// BAD — by_channel is redundant
.index("by_channel", ["channel"])
.index("by_channel_author", ["channel", "author"])

// GOOD — compound index covers prefix queries
.index("by_channel_author", ["channel", "author"])
```

---

## Missing Argument Validators on Public Functions

```typescript
// BAD — no validation, clients can send anything
export const create = mutation({
  handler: async (ctx, args: any) => { ... },
});

// GOOD — runtime type validation
export const create = mutation({
  args: { title: v.string(), year: v.optional(v.number()) },
  handler: async (ctx, args) => { ... },
});
```

---

## Deeply Nested Documents

```typescript
// BAD — hard to query, index, update
defineTable({
  data: v.object({
    settings: v.object({
      preferences: v.object({ ... }),
    }),
  }),
});

// GOOD — flat structure, use ID references
defineTable({
  name: v.string(),
  settingsId: v.id("settings"),
});
```

---

## Summary Checklist

- [ ] Always `await` DB operations and scheduler calls
- [ ] Use `.withIndex()` over `.filter()` for indexed fields
- [ ] Don't `.collect()` large tables — paginate or `.take(n)`
- [ ] Don't use `Date.now()` in queries
- [ ] Combine multiple `ctx.runQuery`/`ctx.runMutation` calls
- [ ] Use `internal.*` for scheduled/server-to-server calls
- [ ] Only actions in `"use node"` files
- [ ] Batch client operations into single mutations
- [ ] Use `null` not `undefined` for absent values
- [ ] Always add argument validators to public functions
- [ ] Keep documents flat, use ID references

# Schema Patterns

Schema design, relationships, indexes, pagination, and type safety.

---

## System Fields

Every document automatically gets:
- `_id`: `Id<"tableName">` — unique, stable
- `_creationTime`: `number` — ms since epoch

---

## Relationship Patterns

### One-to-Many (Back-Reference)

```typescript
posts: defineTable({
  authorId: v.id("users"),
  body: v.string(),
}).index("by_author", ["authorId"]),
```

Query: `ctx.db.query("posts").withIndex("by_author", q => q.eq("authorId", userId))`

### Many-to-Many (Junction Table)

```typescript
artworkCollections: defineTable({
  artworkId: v.id("artworks"),
  collectionId: v.id("collections"),
  order: v.number(),
})
  .index("by_artwork", ["artworkId"])
  .index("by_collection", ["collectionId"])
  .index("by_collection_order", ["collectionId", "order"]),
```

Query via junction:
```typescript
const links = await ctx.db.query("artworkCollections")
  .withIndex("by_collection_order", q => q.eq("collectionId", collectionId))
  .collect();
const artworks = await Promise.all(
  links.map(link => ctx.db.get(link.artworkId))
);
```

### One-to-One

Store ID on one side, add index for reverse lookup.

### Rule of Thumb

Arrays for ~10 items max. Beyond that, use indexed back-references or junction tables.

---

## Index Design

```typescript
defineTable({ channel: v.id("channels"), author: v.id("users"), body: v.string() })
  .index("by_channel", ["channel"])                    // filter by channel
  .index("by_channel_author", ["channel", "author"])   // filter by both
```

**Rules:**
- `_creationTime` appended implicitly to every index
- Compound index: `.eq()` calls first, then optional `.gt()`/`.lt()` bounds
- Max 32 indexes per table, 16 fields per index
- Don't create `by_foo` if `by_foo_bar` exists (compound covers prefix queries)

**Range queries:**
```typescript
.withIndex("by_channel", q =>
  q.eq("channel", channelId)
   .gt("_creationTime", since)
   .lt("_creationTime", until)
)
```

---

## Pagination

### Server

```typescript
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db.query("messages")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

### Client

```typescript
const { results, status, loadMore } = usePaginatedQuery(
  api.messages.list,
  {},
  { initialNumItems: 25 }
);
// status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted"
```

---

## State Machine Pattern

Use union of literals for status fields:

```typescript
defineTable({
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("complete"),
    v.literal("failed")
  ),
  startedAt: v.optional(v.number()),
  error: v.optional(v.string()),
  retryCount: v.optional(v.number()),
}).index("by_status", ["status"]),
```

---

## Enriching Documents

Common pattern: query docs, then add computed fields:

```typescript
export const list = query({
  handler: async (ctx) => {
    const artworks = await ctx.db.query("artworks").collect();
    return Promise.all(artworks.map(async (a) => ({
      ...a,
      imageUrl: await ctx.storage.getUrl(a.imageId),
      thumbnailUrl: a.thumbnailId ? await ctx.storage.getUrl(a.thumbnailId) : null,
    })));
  },
});
```

---

## Type Safety Tips

- Use `Doc<"table">` for full documents (includes `_id`, `_creationTime`)
- Use `Id<"table">` for document IDs
- Use `Infer<typeof validator>` to extract TS type from a validator
- Use `WithoutSystemFields<Doc<"table">>` for insert data
- `QueryCtx`, `MutationCtx`, `ActionCtx` for typed helper function params
- Return type validators prevent accidental data leakage:

```typescript
export const getPublic = query({
  args: { id: v.id("users") },
  returns: v.object({ name: v.string() }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    return { name: user!.name }; // only name exposed
  },
});
```

---

## Convex Values vs JavaScript

- `undefined` is NOT a Convex value. Use `v.null()` / `null` instead.
- `undefined` in objects is silently stripped. In return values, converted to `null`.
- `v.int64()` maps to `bigint`. Use `v.number()` for regular numbers.
- `v.bytes()` maps to `ArrayBuffer`.

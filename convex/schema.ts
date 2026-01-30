import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  artworks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    imageId: v.id("_storage"),
    thumbnailId: v.optional(v.id("_storage")), // 600px max, quality 85
    viewerImageId: v.optional(v.id("_storage")), // 2000px max, quality 90
    collectionId: v.optional(v.id("collections")),
    seriesId: v.optional(v.any()), // DEPRECATED: old field, kept for backwards compat
    year: v.optional(v.number()),
    medium: v.optional(v.string()),
    dimensions: v.optional(v.string()),
    order: v.number(),
    published: v.boolean(),
    createdAt: v.number(),
    // DZI tile pyramid
    dziMetadata: v.optional(
      v.object({
        width: v.number(),
        height: v.number(),
        tileSize: v.number(), // 512
        overlap: v.number(), // 1
        format: v.string(), // "jpg"
        maxLevel: v.number(),
      })
    ),
    dziStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("generating"),
        v.literal("complete"),
        v.literal("failed")
      )
    ),
  })
    .index("by_collection", ["collectionId"])
    .index("by_order", ["order"])
    .index("by_published", ["published"]),

  tiles: defineTable({
    artworkId: v.id("artworks"),
    level: v.number(),
    col: v.number(),
    row: v.number(),
    storageId: v.id("_storage"),
  })
    .index("by_artwork", ["artworkId"])
    .index("by_tile", ["artworkId", "level", "col", "row"]),

  collections: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    slug: v.string(),
    order: v.number(),
    coverImageId: v.optional(v.id("_storage")),
    iconSvg: v.optional(v.string()),
    nativeAspectRatio: v.optional(v.boolean()),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),

  messages: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  }).index("by_read", ["read"]),

  siteContent: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
});

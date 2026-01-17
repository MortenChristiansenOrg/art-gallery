import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  artworks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    imageId: v.id("_storage"),
    seriesId: v.optional(v.id("series")),
    year: v.optional(v.number()),
    medium: v.optional(v.string()),
    dimensions: v.optional(v.string()),
    order: v.number(),
    published: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_series", ["seriesId"])
    .index("by_order", ["order"])
    .index("by_published", ["published"]),

  series: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    slug: v.string(),
    order: v.number(),
    coverImageId: v.optional(v.id("_storage")),
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

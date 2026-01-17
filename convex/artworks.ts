import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {
    seriesId: v.optional(v.id("series")),
    publishedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let artworks;
    if (args.seriesId) {
      artworks = await ctx.db
        .query("artworks")
        .withIndex("by_series", (q) => q.eq("seriesId", args.seriesId))
        .collect();
    } else {
      artworks = await ctx.db.query("artworks").collect();
    }

    if (args.publishedOnly) {
      artworks = artworks.filter((a) => a.published);
    }

    artworks.sort((a, b) => a.order - b.order);

    return Promise.all(
      artworks.map(async (artwork) => ({
        ...artwork,
        imageUrl: await ctx.storage.getUrl(artwork.imageId),
      }))
    );
  },
});

export const get = query({
  args: { id: v.id("artworks") },
  handler: async (ctx, args) => {
    const artwork = await ctx.db.get(args.id);
    if (!artwork) return null;
    return {
      ...artwork,
      imageUrl: await ctx.storage.getUrl(artwork.imageId),
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    imageId: v.id("_storage"),
    seriesId: v.optional(v.id("series")),
    year: v.optional(v.number()),
    medium: v.optional(v.string()),
    dimensions: v.optional(v.string()),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("artworks").collect();
    const maxOrder = existing.reduce((max, a) => Math.max(max, a.order), -1);

    return ctx.db.insert("artworks", {
      ...args,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("artworks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    seriesId: v.optional(v.id("series")),
    year: v.optional(v.number()),
    medium: v.optional(v.string()),
    dimensions: v.optional(v.string()),
    published: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const remove = mutation({
  args: { id: v.id("artworks") },
  handler: async (ctx, args) => {
    const artwork = await ctx.db.get(args.id);
    if (artwork) {
      await ctx.storage.delete(artwork.imageId);
      await ctx.db.delete(args.id);
    }
  },
});

export const reorder = mutation({
  args: {
    ids: v.array(v.id("artworks")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.ids.length; i++) {
      await ctx.db.patch(args.ids[i], { order: i });
    }
  },
});

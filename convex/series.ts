import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    const series = await ctx.db.query("series").collect();
    series.sort((a, b) => a.order - b.order);

    return Promise.all(
      series.map(async (s) => ({
        ...s,
        coverImageUrl: s.coverImageId
          ? await ctx.storage.getUrl(s.coverImageId)
          : null,
      }))
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const series = await ctx.db
      .query("series")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!series) return null;

    return {
      ...series,
      coverImageUrl: series.coverImageId
        ? await ctx.storage.getUrl(series.coverImageId)
        : null,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    slug: v.string(),
    coverImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("series").collect();
    const maxOrder = existing.reduce((max, s) => Math.max(max, s.order), -1);

    return ctx.db.insert("series", {
      ...args,
      order: maxOrder + 1,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("series"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    slug: v.optional(v.string()),
    coverImageId: v.optional(v.id("_storage")),
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
  args: { id: v.id("series") },
  handler: async (ctx, args) => {
    const series = await ctx.db.get(args.id);
    if (series) {
      if (series.coverImageId) {
        await ctx.storage.delete(series.coverImageId);
      }
      // Unlink artworks from this series
      const artworks = await ctx.db
        .query("artworks")
        .withIndex("by_series", (q) => q.eq("seriesId", args.id))
        .collect();
      for (const artwork of artworks) {
        await ctx.db.patch(artwork._id, { seriesId: undefined });
      }
      await ctx.db.delete(args.id);
    }
  },
});

export const reorder = mutation({
  args: {
    ids: v.array(v.id("series")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.ids.length; i++) {
      await ctx.db.patch(args.ids[i], { order: i });
    }
  },
});

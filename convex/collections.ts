import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./auth";
import { sanitizeSvg } from "./sanitize";

export const list = query({
  handler: async (ctx) => {
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_order")
      .order("asc")
      .collect();

    return Promise.all(
      collections.map(async (c) => ({
        ...c,
        coverImageUrl: c.coverImageId
          ? await ctx.storage.getUrl(c.coverImageId)
          : null,
      }))
    );
  },
});

export const listWithCounts = query({
  handler: async (ctx) => {
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_order")
      .order("asc")
      .collect();

    return Promise.all(
      collections.map(async (c) => {
        const junctionEntries = await ctx.db
          .query("artworkCollections")
          .withIndex("by_collection", (q) => q.eq("collectionId", c._id))
          .collect();
        let artworkCount = 0;
        for (const j of junctionEntries) {
          const artwork = await ctx.db.get(j.artworkId);
          if (artwork?.published && artwork.thumbnailId && artwork.dziStatus === "complete") {
            artworkCount++;
          }
        }
        return {
          ...c,
          coverImageUrl: c.coverImageId
            ? await ctx.storage.getUrl(c.coverImageId)
            : null,
          artworkCount,
        };
      })
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const collection = await ctx.db
      .query("collections")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!collection) return null;

    return {
      ...collection,
      coverImageUrl: collection.coverImageId
        ? await ctx.storage.getUrl(collection.coverImageId)
        : null,
    };
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    slug: v.string(),
    coverImageId: v.optional(v.id("_storage")),
    iconSvg: v.optional(v.string()),
    nativeAspectRatio: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    const { token: _, coverImageId, iconSvg, nativeAspectRatio, ...rest } = args;
    const last = await ctx.db
      .query("collections")
      .withIndex("by_order")
      .order("desc")
      .first();
    const maxOrder = last?.order ?? -1;

    return ctx.db.insert("collections", {
      ...rest,
      order: maxOrder + 1,
      // Mutual exclusivity: only one of these can be set
      ...(iconSvg && !coverImageId ? { iconSvg: sanitizeSvg(iconSvg) } : {}),
      ...(coverImageId && !iconSvg ? { coverImageId } : {}),
      ...(nativeAspectRatio !== undefined ? { nativeAspectRatio } : {}),
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("collections"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    slug: v.optional(v.string()),
    coverImageId: v.optional(v.id("_storage")),
    iconSvg: v.optional(v.string()),
    nativeAspectRatio: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    const { id, token: _, ...updates } = args;
    if (updates.iconSvg) {
      updates.iconSvg = sanitizeSvg(updates.iconSvg);
    }
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("collections") },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    const collection = await ctx.db.get(args.id);
    if (collection) {
      if (collection.coverImageId) {
        await ctx.storage.delete(collection.coverImageId);
      }
      // Delete junction table entries for this collection
      const junctionEntries = await ctx.db
        .query("artworkCollections")
        .withIndex("by_collection", (q) => q.eq("collectionId", args.id))
        .collect();
      for (const entry of junctionEntries) {
        await ctx.db.delete(entry._id);
      }
      await ctx.db.delete(args.id);
    }
  },
});

export const reorder = mutation({
  args: {
    token: v.string(),
    ids: v.array(v.id("collections")),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    for (let i = 0; i < args.ids.length; i++) {
      await ctx.db.patch(args.ids[i], { order: i });
    }
  },
});

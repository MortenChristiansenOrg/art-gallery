import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./auth";

export const list = query({
  handler: async (ctx) => {
    const collections = await ctx.db.query("collections").collect();
    collections.sort((a, b) => a.order - b.order);

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
    const collections = await ctx.db.query("collections").collect();
    collections.sort((a, b) => a.order - b.order);

    // Count via junction table
    const allJunction = await ctx.db.query("artworkCollections").collect();
    const allArtworks = await ctx.db.query("artworks").collect();
    const publishedIds = new Set(
      allArtworks
        .filter((a) => a.published && a.thumbnailId && a.dziStatus === "complete")
        .map((a) => a._id)
    );

    return Promise.all(
      collections.map(async (c) => {
        const artworkCount = allJunction.filter(
          (j) => j.collectionId === c._id && publishedIds.has(j.artworkId)
        ).length;
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
    const existing = await ctx.db.query("collections").collect();
    const maxOrder = existing.reduce((max, c) => Math.max(max, c.order), -1);

    return ctx.db.insert("collections", {
      ...rest,
      order: maxOrder + 1,
      // Mutual exclusivity: only one of these can be set
      ...(iconSvg && !coverImageId ? { iconSvg } : {}),
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
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    // Mutual exclusivity handled client-side; just apply the patch
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

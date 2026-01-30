import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAuth } from "./auth";

// Build DZI URL from artwork ID
function getDziUrl(artworkId: string, dziStatus?: string): string | null {
  if (dziStatus !== "complete") return null;
  return `/dzi/${artworkId}.dzi`;
}

export const list = query({
  args: {
    collectionId: v.optional(v.id("collections")),
    publishedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let artworks;
    if (args.collectionId) {
      // Query junction table to find artworks in this collection
      const junctionEntries = await ctx.db
        .query("artworkCollections")
        .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId!))
        .collect();
      junctionEntries.sort((a, b) => a.order - b.order);
      const fetched = await Promise.all(
        junctionEntries.map((entry) => ctx.db.get(entry.artworkId))
      );
      artworks = fetched.filter((a) => a !== null);
    } else {
      artworks = await ctx.db.query("artworks").collect();
    }

    if (args.publishedOnly) {
      artworks = artworks.filter(
        (a) => a.published && a.thumbnailId && a.dziStatus === "complete"
      );
    }

    if (!args.collectionId) {
      artworks.sort((a, b) => a.order - b.order);
    }

    // Get collection counts for each artwork
    const allJunction = await ctx.db.query("artworkCollections").collect();
    const countMap = new Map<string, number>();
    for (const entry of allJunction) {
      countMap.set(
        entry.artworkId,
        (countMap.get(entry.artworkId) ?? 0) + 1
      );
    }

    return Promise.all(
      artworks.map(async (artwork) => ({
        ...artwork,
        imageUrl: await ctx.storage.getUrl(artwork.imageId),
        thumbnailUrl: artwork.thumbnailId
          ? await ctx.storage.getUrl(artwork.thumbnailId)
          : null,
        viewerImageUrl: artwork.viewerImageId
          ? await ctx.storage.getUrl(artwork.viewerImageId)
          : null,
        dziUrl: getDziUrl(artwork._id, artwork.dziStatus),
        collectionCount: countMap.get(artwork._id) ?? 0,
      }))
    );
  },
});

export const get = query({
  args: {
    id: v.id("artworks"),
    publishedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const artwork = await ctx.db.get(args.id);
    if (!artwork) return null;

    if (
      args.publishedOnly &&
      (!artwork.published || !artwork.thumbnailId || artwork.dziStatus !== "complete")
    ) {
      return null;
    }

    return {
      ...artwork,
      imageUrl: await ctx.storage.getUrl(artwork.imageId),
      thumbnailUrl: artwork.thumbnailId
        ? await ctx.storage.getUrl(artwork.thumbnailId)
        : null,
      viewerImageUrl: artwork.viewerImageId
        ? await ctx.storage.getUrl(artwork.viewerImageId)
        : null,
      dziUrl: getDziUrl(artwork._id, artwork.dziStatus),
    };
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    imageId: v.id("_storage"),
    collectionId: v.optional(v.id("collections")),
    year: v.optional(v.number()),
    medium: v.optional(v.string()),
    dimensions: v.optional(v.string()),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    const { token: _, collectionId, ...data } = args;
    const existing = await ctx.db.query("artworks").collect();
    const maxOrder = existing.reduce((max, a) => Math.max(max, a.order), -1);

    const artworkId = await ctx.db.insert("artworks", {
      ...data,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });

    // Create junction table entry if collectionId provided
    if (collectionId) {
      const junctionEntries = await ctx.db
        .query("artworkCollections")
        .withIndex("by_collection", (q) => q.eq("collectionId", collectionId))
        .collect();
      const maxJunctionOrder = junctionEntries.reduce(
        (max, e) => Math.max(max, e.order),
        -1
      );
      await ctx.db.insert("artworkCollections", {
        artworkId,
        collectionId,
        order: maxJunctionOrder + 1,
      });
    }

    return artworkId;
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("artworks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    collectionId: v.optional(v.id("collections")),
    year: v.optional(v.number()),
    medium: v.optional(v.string()),
    dimensions: v.optional(v.string()),
    published: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    const { id, token: _, collectionId: _cid, ...updates } = args;

    // If imageId is being updated, cleanup old tiles and reset DZI status
    if (updates.imageId) {
      const artwork = await ctx.db.get(id);
      if (artwork && artwork.imageId !== updates.imageId) {
        if (artwork.thumbnailId) await ctx.storage.delete(artwork.thumbnailId);
        if (artwork.viewerImageId) await ctx.storage.delete(artwork.viewerImageId);
        await ctx.scheduler.runAfter(0, internal.dzi.cleanupTiles, {
          artworkId: id,
        });
        await ctx.db.patch(id, {
          dziStatus: "pending",
          dziMetadata: undefined,
          thumbnailId: undefined,
          viewerImageId: undefined,
        });
      }
    }

    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("artworks") },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    const artwork = await ctx.db.get(args.id);
    if (artwork) {
      await ctx.storage.delete(artwork.imageId);
      if (artwork.thumbnailId) await ctx.storage.delete(artwork.thumbnailId);
      if (artwork.viewerImageId) await ctx.storage.delete(artwork.viewerImageId);
      await ctx.scheduler.runAfter(0, internal.dzi.cleanupTiles, {
        artworkId: args.id,
      });
      // Delete all junction table entries
      const junctionEntries = await ctx.db
        .query("artworkCollections")
        .withIndex("by_artwork", (q) => q.eq("artworkId", args.id))
        .collect();
      for (const entry of junctionEntries) {
        await ctx.db.delete(entry._id);
      }
      await ctx.db.delete(args.id);
    }
  },
});

export const addToCollection = mutation({
  args: {
    token: v.string(),
    artworkId: v.id("artworks"),
    collectionId: v.id("collections"),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);

    // Check for duplicate
    const existing = await ctx.db
      .query("artworkCollections")
      .withIndex("by_artwork", (q) => q.eq("artworkId", args.artworkId))
      .collect();
    if (existing.some((e) => e.collectionId === args.collectionId)) {
      throw new Error("Artwork already in this collection");
    }

    // Get max order in collection
    const junctionEntries = await ctx.db
      .query("artworkCollections")
      .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId))
      .collect();
    const maxOrder = junctionEntries.reduce((max, e) => Math.max(max, e.order), -1);

    await ctx.db.insert("artworkCollections", {
      artworkId: args.artworkId,
      collectionId: args.collectionId,
      order: maxOrder + 1,
    });
  },
});

export const removeFromCollection = mutation({
  args: {
    token: v.string(),
    artworkId: v.id("artworks"),
    collectionId: v.id("collections"),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);

    const entries = await ctx.db
      .query("artworkCollections")
      .withIndex("by_artwork", (q) => q.eq("artworkId", args.artworkId))
      .collect();
    const entry = entries.find((e) => e.collectionId === args.collectionId);
    if (entry) {
      await ctx.db.delete(entry._id);
    }
  },
});

export const searchByTitle = query({
  args: {
    query: v.string(),
    collectionId: v.optional(v.id("collections")),
  },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    const allArtworks = await ctx.db.query("artworks").collect();
    const searchLower = args.query.toLowerCase();
    const matches = allArtworks.filter((a) =>
      a.title.toLowerCase().includes(searchLower)
    );

    // Get which artworks are already in the target collection
    let inCollectionIds = new Set<string>();
    if (args.collectionId) {
      const entries = await ctx.db
        .query("artworkCollections")
        .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId!))
        .collect();
      inCollectionIds = new Set(entries.map((e) => e.artworkId));
    }

    return Promise.all(
      matches.slice(0, 20).map(async (a) => ({
        _id: a._id,
        title: a.title,
        thumbnailUrl: a.thumbnailId
          ? await ctx.storage.getUrl(a.thumbnailId)
          : null,
        alreadyInCollection: inCollectionIds.has(a._id),
      }))
    );
  },
});

export const reorder = mutation({
  args: {
    token: v.string(),
    ids: v.array(v.id("artworks")),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    for (let i = 0; i < args.ids.length; i++) {
      await ctx.db.patch(args.ids[i], { order: i });
    }
  },
});

export const updateVariants = internalMutation({
  args: {
    artworkId: v.id("artworks"),
    thumbnailId: v.id("_storage"),
    viewerImageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.artworkId, {
      thumbnailId: args.thumbnailId,
      viewerImageId: args.viewerImageId,
    });
  },
});

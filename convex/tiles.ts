import { v } from "convex/values";
import { query, internalQuery, internalMutation } from "./_generated/server";

// Public query to get a specific tile's storage URL
export const getTile = query({
  args: {
    artworkId: v.id("artworks"),
    level: v.number(),
    col: v.number(),
    row: v.number(),
  },
  handler: async (ctx, args) => {
    const tile = await ctx.db
      .query("tiles")
      .withIndex("by_tile", (q) =>
        q
          .eq("artworkId", args.artworkId)
          .eq("level", args.level)
          .eq("col", args.col)
          .eq("row", args.row)
      )
      .unique();

    if (!tile) return null;

    return {
      ...tile,
      url: await ctx.storage.getUrl(tile.storageId),
    };
  },
});

// Get artwork DZI metadata
export const getDziMetadata = query({
  args: {
    artworkId: v.id("artworks"),
  },
  handler: async (ctx, args) => {
    const artwork = await ctx.db.get(args.artworkId);
    if (!artwork) return null;

    return {
      dziMetadata: artwork.dziMetadata,
      dziStatus: artwork.dziStatus,
    };
  },
});

// Internal: list all tiles for an artwork
export const listByArtwork = internalQuery({
  args: {
    artworkId: v.id("artworks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tiles")
      .withIndex("by_artwork", (q) => q.eq("artworkId", args.artworkId))
      .collect();
  },
});

// Internal: create a tile record
export const createTile = internalMutation({
  args: {
    artworkId: v.id("artworks"),
    level: v.number(),
    col: v.number(),
    row: v.number(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tiles", args);
  },
});

// Internal: delete a tile record
export const deleteTile = internalMutation({
  args: {
    tileId: v.id("tiles"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.tileId);
  },
});

// Internal: set DZI status
export const setDziStatus = internalMutation({
  args: {
    artworkId: v.id("artworks"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("generating"),
        v.literal("complete"),
        v.literal("failed")
      )
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.artworkId, { dziStatus: args.status });
  },
});

// Internal: set DZI metadata
export const setDziMetadata = internalMutation({
  args: {
    artworkId: v.id("artworks"),
    metadata: v.optional(
      v.object({
        width: v.number(),
        height: v.number(),
        tileSize: v.number(),
        overlap: v.number(),
        format: v.string(),
        maxLevel: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.artworkId, { dziMetadata: args.metadata });
  },
});

// Internal: list artworks without DZI
export const listArtworksWithoutDzi = internalQuery({
  args: {},
  handler: async (ctx) => {
    const artworks = await ctx.db.query("artworks").collect();
    return artworks.filter(
      (a) => !a.dziStatus || a.dziStatus === "failed"
    );
  },
});

// Internal: get tile for HTTP serving
export const getTileInternal = internalQuery({
  args: {
    artworkId: v.id("artworks"),
    level: v.number(),
    col: v.number(),
    row: v.number(),
  },
  handler: async (ctx, args) => {
    const tile = await ctx.db
      .query("tiles")
      .withIndex("by_tile", (q) =>
        q
          .eq("artworkId", args.artworkId)
          .eq("level", args.level)
          .eq("col", args.col)
          .eq("row", args.row)
      )
      .unique();

    if (!tile) return null;

    return {
      storageId: tile.storageId,
      url: await ctx.storage.getUrl(tile.storageId),
    };
  },
});

// Internal: get artwork for HTTP serving
export const getArtworkInternal = internalQuery({
  args: {
    artworkId: v.id("artworks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.artworkId);
  },
});

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Clean up tiles for an artwork (when artwork deleted)
export const cleanupTiles = internalAction({
  args: {
    artworkId: v.id("artworks"),
    expectedImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Guard against race: if image was replaced, don't cleanup old tiles
    if (args.expectedImageId) {
      const artwork = await ctx.runQuery(internal.tiles.getArtworkInternal, {
        artworkId: args.artworkId,
      });
      if (artwork && artwork.imageId !== args.expectedImageId) return;
    }

    // Get all tiles
    const tiles = await ctx.runQuery(internal.tiles.listByArtwork, {
      artworkId: args.artworkId,
    });

    // Delete storage and records
    for (const tile of tiles) {
      await ctx.storage.delete(tile.storageId);
      await ctx.runMutation(internal.tiles.deleteTile, { tileId: tile._id });
    }

    await ctx.runMutation(internal.tiles.setDziStatus, {
      artworkId: args.artworkId,
      status: undefined,
    });
    await ctx.runMutation(internal.tiles.setDziMetadata, {
      artworkId: args.artworkId,
      metadata: undefined,
    });
  },
});

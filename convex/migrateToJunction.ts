import { internalMutation } from "./_generated/server";

export const migrateCollectionIds = internalMutation({
  handler: async (ctx) => {
    const artworks = await ctx.db.query("artworks").collect();
    let migrated = 0;

    for (const artwork of artworks) {
      if (!artwork.collectionId) continue;

      // Check if junction entry already exists
      const existing = await ctx.db
        .query("artworkCollections")
        .withIndex("by_artwork", (q) => q.eq("artworkId", artwork._id))
        .collect();

      if (existing.some((e) => e.collectionId === artwork.collectionId)) continue;

      // Get max order in collection
      const entries = await ctx.db
        .query("artworkCollections")
        .withIndex("by_collection", (q) =>
          q.eq("collectionId", artwork.collectionId!)
        )
        .collect();
      const maxOrder = entries.reduce((max, e) => Math.max(max, e.order), -1);

      await ctx.db.insert("artworkCollections", {
        artworkId: artwork._id,
        collectionId: artwork.collectionId,
        order: maxOrder + 1,
      });

      // Clear the deprecated field
      await ctx.db.patch(artwork._id, { collectionId: undefined });
      migrated++;
    }

    return { migrated };
  },
});

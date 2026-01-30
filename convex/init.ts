import { mutation } from "./_generated/server";

export const ensureDefaultCollection = mutation({
  handler: async (ctx) => {
    const defaultCollection = await ctx.db
      .query("collections")
      .filter((q) => q.eq(q.field("slug"), "cabinet-of-curiosities"))
      .first();
    if (defaultCollection) return; // already migrated

    // Create default collection at order 0
    const defaultId = await ctx.db.insert("collections", {
      name: "Cabinet of Curiosities",
      slug: "cabinet-of-curiosities",
      description: "Uncategorized works and experiments",
      order: 0,
    });

    // Bump existing collections' order by 1
    const allCollections = await ctx.db.query("collections").collect();
    for (const c of allCollections) {
      if (c._id !== defaultId) {
        await ctx.db.patch(c._id, { order: (c.order ?? 0) + 1 });
      }
    }

    // Assign uncategorized artworks to the default collection
    const artworks = await ctx.db.query("artworks").collect();
    for (const a of artworks) {
      if (!a.collectionId) {
        await ctx.db.patch(a._id, { collectionId: defaultId });
      }
    }
  },
});

/**
 * Backfill artworkCollections junction table from legacy collectionId field.
 * Idempotent — skips artworks already in the junction table.
 */
export const backfillJunctionTable = mutation({
  handler: async (ctx) => {
    const artworks = await ctx.db.query("artworks").collect();
    let migrated = 0;

    for (const artwork of artworks) {
      if (!artwork.collectionId) continue;

      const existing = await ctx.db
        .query("artworkCollections")
        .withIndex("by_artwork", (q) => q.eq("artworkId", artwork._id))
        .collect();

      if (existing.some((e) => e.collectionId === artwork.collectionId))
        continue;

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

      await ctx.db.patch(artwork._id, { collectionId: undefined });
      migrated++;
    }

    return { migrated };
  },
});

import { mutation } from "./_generated/server";

export const ensureDefaultCollection = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("collections").first();
    if (existing) return; // already migrated

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
        await ctx.db.patch(c._id, { order: c.order + 1 });
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

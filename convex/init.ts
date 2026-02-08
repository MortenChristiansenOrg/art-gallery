import { mutation } from "./_generated/server";

export const ensureDefaultCollection = mutation({
  handler: async (ctx) => {
    const defaultCollection = await ctx.db
      .query("collections")
      .withIndex("by_slug", (q) => q.eq("slug", "cabinet-of-curiosities"))
      .first();
    if (defaultCollection) return; // already migrated

    // Create default collection at order 0
    const defaultId = await ctx.db.insert("collections", {
      name: "Cabinet of Curiosities",
      slug: "cabinet-of-curiosities",
      description: "Uncategorized works and experiments",
      order: 0,
      published: true,
    });

    // Bump existing collections' order by 1
    const allCollections = await ctx.db.query("collections").collect();
    for (const c of allCollections) {
      if (c._id !== defaultId) {
        await ctx.db.patch(c._id, { order: (c.order ?? 0) + 1 });
      }
    }

  },
});

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./auth";

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const content = await ctx.db
      .query("siteContent")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    return content?.value ?? null;
  },
});

export const set = mutation({
  args: {
    token: v.string(),
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    const { token: _, ...data } = args;
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("by_key", (q) => q.eq("key", data.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: data.value });
    } else {
      await ctx.db.insert("siteContent", data);
    }
  },
});

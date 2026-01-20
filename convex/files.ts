import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAuth } from "./auth";

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    return await ctx.storage.generateUploadUrl();
  },
});

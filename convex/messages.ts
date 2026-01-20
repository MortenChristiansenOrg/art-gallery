import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./auth";

export const list = query({
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();
    messages.sort((a, b) => b.createdAt - a.createdAt);
    return messages;
  },
});

export const unreadCount = query({
  handler: async (ctx) => {
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_read", (q) => q.eq("read", false))
      .collect();
    return unread.length;
  },
});

export const send = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("messages", {
      ...args,
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const markRead = mutation({
  args: { token: v.string(), id: v.id("messages") },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    await ctx.db.patch(args.id, { read: true });
  },
});

export const markAllRead = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_read", (q) => q.eq("read", false))
      .collect();
    for (const msg of unread) {
      await ctx.db.patch(msg._id, { read: true });
    }
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("messages") },
  handler: async (ctx, args) => {
    requireAuth(args.token);
    await ctx.db.delete(args.id);
  },
});

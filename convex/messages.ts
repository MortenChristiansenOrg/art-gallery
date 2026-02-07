import { ConvexError, v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./auth";

const MAX_NAME_LENGTH = 200;
const MAX_EMAIL_LENGTH = 320;
const MAX_MESSAGE_LENGTH = 5000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(args.token);
    return await ctx.db.query("messages").order("desc").collect();
  },
});

export const unreadCount = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(args.token);
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
    const name = args.name.trim();
    const email = args.email.trim();
    const message = args.message.trim();

    if (!name || !email || !message) {
      throw new ConvexError("All fields are required");
    }
    if (name.length > MAX_NAME_LENGTH) {
      throw new ConvexError("Name is too long");
    }
    if (email.length > MAX_EMAIL_LENGTH) {
      throw new ConvexError("Email is too long");
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new ConvexError("Message is too long");
    }
    if (!EMAIL_REGEX.test(email)) {
      throw new ConvexError("Invalid email address");
    }

    // Basic rate limiting: reject if same email sent a message in last 60s
    const recent = await ctx.db
      .query("messages")
      .order("desc")
      .filter((q) => q.eq(q.field("email"), email))
      .first();
    if (recent && Date.now() - recent.createdAt < 60_000) {
      throw new ConvexError("Please wait before sending another message");
    }

    return ctx.db.insert("messages", {
      name,
      email,
      message,
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const markRead = mutation({
  args: { token: v.string(), id: v.id("messages") },
  handler: async (ctx, args) => {
    await requireAuth(args.token);
    await ctx.db.patch(args.id, { read: true });
  },
});

export const markAllRead = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(args.token);
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
    await requireAuth(args.token);
    await ctx.db.delete(args.id);
  },
});

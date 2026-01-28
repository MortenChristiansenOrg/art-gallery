import { describe, it, expect, beforeEach, vi } from "vitest";
import { api } from "../_generated/api";
import { createTestContext, Id } from "./setup";

describe("messages", () => {
  const validToken = btoa(`${Date.now()}:validhash`);

  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", "test-password");
  });

  describe("list", () => {
    it("returns empty array when no messages", async () => {
      const t = createTestContext();
      const result = await t.query(api.messages.list, {});
      expect(result).toEqual([]);
    });

    it("returns messages sorted by createdAt descending", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        await ctx.db.insert("messages", {
          name: "First",
          email: "first@test.com",
          message: "First message",
          read: false,
          createdAt: 1000,
        });
        await ctx.db.insert("messages", {
          name: "Second",
          email: "second@test.com",
          message: "Second message",
          read: false,
          createdAt: 2000,
        });
      });

      const result = await t.query(api.messages.list, {});
      expect(result[0].name).toBe("Second"); // Newer first
      expect(result[1].name).toBe("First");
    });
  });

  describe("unreadCount", () => {
    it("returns 0 when no unread messages", async () => {
      const t = createTestContext();
      const result = await t.query(api.messages.unreadCount, {});
      expect(result).toBe(0);
    });

    it("returns count of unread messages", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        await ctx.db.insert("messages", {
          name: "Unread 1",
          email: "test@test.com",
          message: "Test",
          read: false,
          createdAt: Date.now(),
        });
        await ctx.db.insert("messages", {
          name: "Unread 2",
          email: "test@test.com",
          message: "Test",
          read: false,
          createdAt: Date.now(),
        });
        await ctx.db.insert("messages", {
          name: "Read",
          email: "test@test.com",
          message: "Test",
          read: true,
          createdAt: Date.now(),
        });
      });

      const result = await t.query(api.messages.unreadCount, {});
      expect(result).toBe(2);
    });
  });

  describe("send", () => {
    it("creates a new message", async () => {
      const t = createTestContext();

      const id = await t.mutation(api.messages.send, {
        name: "John Doe",
        email: "john@example.com",
        message: "Hello!",
      });

      expect(id).toBeDefined();

      const messages = await t.query(api.messages.list, {});
      expect(messages).toHaveLength(1);
      expect(messages[0].name).toBe("John Doe");
      expect(messages[0].email).toBe("john@example.com");
      expect(messages[0].message).toBe("Hello!");
      expect(messages[0].read).toBe(false);
    });
  });

  describe("markRead", () => {
    it("marks message as read", async () => {
      const t = createTestContext();

      let messageId: Id<"messages"> | undefined;
      await t.run(async (ctx) => {
        messageId = await ctx.db.insert("messages", {
          name: "Test",
          email: "test@test.com",
          message: "Test",
          read: false,
          createdAt: Date.now(),
        });
      });

      await t.mutation(api.messages.markRead, {
        token: validToken,
        id: messageId!,
      });

      const messages = await t.query(api.messages.list, {});
      expect(messages[0].read).toBe(true);
    });

    it("throws without valid token", async () => {
      const t = createTestContext();

      let messageId: Id<"messages"> | undefined;
      await t.run(async (ctx) => {
        messageId = await ctx.db.insert("messages", {
          name: "Test",
          email: "test@test.com",
          message: "Test",
          read: false,
          createdAt: Date.now(),
        });
      });

      await expect(
        t.mutation(api.messages.markRead, {
          token: "invalid",
          id: messageId!,
        })
      ).rejects.toThrow();
    });
  });

  describe("markAllRead", () => {
    it("marks all messages as read", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        await ctx.db.insert("messages", {
          name: "Msg 1",
          email: "test@test.com",
          message: "Test",
          read: false,
          createdAt: Date.now(),
        });
        await ctx.db.insert("messages", {
          name: "Msg 2",
          email: "test@test.com",
          message: "Test",
          read: false,
          createdAt: Date.now(),
        });
      });

      await t.mutation(api.messages.markAllRead, {
        token: validToken,
      });

      const unread = await t.query(api.messages.unreadCount, {});
      expect(unread).toBe(0);
    });
  });

  describe("remove", () => {
    it("deletes message", async () => {
      const t = createTestContext();

      let messageId: Id<"messages"> | undefined;
      await t.run(async (ctx) => {
        messageId = await ctx.db.insert("messages", {
          name: "To Delete",
          email: "test@test.com",
          message: "Test",
          read: false,
          createdAt: Date.now(),
        });
      });

      await t.mutation(api.messages.remove, {
        token: validToken,
        id: messageId!,
      });

      const messages = await t.query(api.messages.list, {});
      expect(messages).toHaveLength(0);
    });

    it("throws without valid token", async () => {
      const t = createTestContext();

      let messageId: Id<"messages"> | undefined;
      await t.run(async (ctx) => {
        messageId = await ctx.db.insert("messages", {
          name: "Test",
          email: "test@test.com",
          message: "Test",
          read: false,
          createdAt: Date.now(),
        });
      });

      await expect(
        t.mutation(api.messages.remove, {
          token: "invalid",
          id: messageId!,
        })
      ).rejects.toThrow();
    });
  });
});

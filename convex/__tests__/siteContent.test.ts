import { describe, it, expect, beforeEach, vi } from "vitest";
import { api } from "../_generated/api";
import { createTestContext } from "./setup";

describe("siteContent", () => {
  const validToken = btoa(`${Date.now()}:validhash`);

  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", "test-password");
  });

  describe("get", () => {
    it("returns null when key not found", async () => {
      const t = createTestContext();
      const result = await t.query(api.siteContent.get, { key: "nonexistent" });
      expect(result).toBeNull();
    });

    it("returns value when key exists", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        await ctx.db.insert("siteContent", {
          key: "about",
          value: "About page content",
        });
      });

      const result = await t.query(api.siteContent.get, { key: "about" });
      expect(result).toBe("About page content");
    });
  });

  describe("set", () => {
    it("throws without valid token", async () => {
      const t = createTestContext();

      await expect(
        t.mutation(api.siteContent.set, {
          token: "invalid",
          key: "about",
          value: "New content",
        })
      ).rejects.toThrow();
    });

    it("creates new content entry", async () => {
      const t = createTestContext();

      await t.mutation(api.siteContent.set, {
        token: validToken,
        key: "about",
        value: "New about content",
      });

      const result = await t.query(api.siteContent.get, { key: "about" });
      expect(result).toBe("New about content");
    });

    it("updates existing content entry", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        await ctx.db.insert("siteContent", {
          key: "about",
          value: "Original content",
        });
      });

      await t.mutation(api.siteContent.set, {
        token: validToken,
        key: "about",
        value: "Updated content",
      });

      const result = await t.query(api.siteContent.get, { key: "about" });
      expect(result).toBe("Updated content");
    });
  });
});

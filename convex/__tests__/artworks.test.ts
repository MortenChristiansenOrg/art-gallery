import { describe, it, expect, beforeEach, vi } from "vitest";
import { api } from "../_generated/api";
import { createTestContext, createTestBlob, Id } from "./setup";

describe("artworks", () => {
  // Mock auth token
  const validToken = btoa(`${Date.now()}:validhash`);

  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", "test-password");
  });

  describe("list", () => {
    it("returns empty array when no artworks", async () => {
      const t = createTestContext();
      const result = await t.query(api.artworks.list, {});
      expect(result).toEqual([]);
    });

    it("returns all artworks", async () => {
      const t = createTestContext();

      // Insert test data directly
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        await ctx.db.insert("artworks", {
          title: "Test Artwork",
          imageId: storageId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
      });

      const result = await t.query(api.artworks.list, {});
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Test Artwork");
    });

    it("filters by collection", async () => {
      const t = createTestContext();

      let collectionId: Id<"collections"> | undefined;
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        collectionId = await ctx.db.insert("collections", {
          name: "Test Collection",
          slug: "test",
          order: 0,
        });
        await ctx.db.insert("artworks", {
          title: "In Collection",
          imageId: storageId,
          collectionId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
        await ctx.db.insert("artworks", {
          title: "Not In Collection",
          imageId: storageId,
          order: 1,
          published: true,
          createdAt: Date.now(),
        });
      });

      const result = await t.query(api.artworks.list, {
        collectionId: collectionId!,
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("In Collection");
    });

    it("sorts by order", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        await ctx.db.insert("artworks", {
          title: "Second",
          imageId: storageId,
          order: 2,
          published: true,
          createdAt: Date.now(),
        });
        await ctx.db.insert("artworks", {
          title: "First",
          imageId: storageId,
          order: 1,
          published: true,
          createdAt: Date.now(),
        });
      });

      const result = await t.query(api.artworks.list, {});
      expect(result[0].title).toBe("First");
      expect(result[1].title).toBe("Second");
    });
  });

  describe("get", () => {
    it("returns null for non-existent artwork", async () => {
      const t = createTestContext();

      // Create a valid ID format that doesn't exist
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        const id = await ctx.db.insert("artworks", {
          title: "Temp",
          imageId: storageId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
        await ctx.db.delete(id);

        const result = await ctx.db.get(id);
        expect(result).toBeNull();
      });
    });

    it("returns artwork by id", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
      });

      const result = await t.query(api.artworks.get, {
        id: artworkId!,
      });
      expect(result?.title).toBe("Test");
    });
  });

  describe("create", () => {
    it("creates artwork with valid token", async () => {
      const t = createTestContext();

      let storageId: Id<"_storage"> | undefined;
      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
      });

      const id = await t.mutation(api.artworks.create, {
        token: validToken,
        title: "New Artwork",
        imageId: storageId!,
        published: false,
      });

      expect(id).toBeDefined();

      const artwork = await t.query(api.artworks.get, { id });
      expect(artwork?.title).toBe("New Artwork");
    });

    it("sets order to max + 1", async () => {
      const t = createTestContext();

      let storageId: Id<"_storage"> | undefined;
      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
        await ctx.db.insert("artworks", {
          title: "Existing",
          imageId: storageId,
          order: 5,
          published: true,
          createdAt: Date.now(),
        });
      });

      const id = await t.mutation(api.artworks.create, {
        token: validToken,
        title: "New",
        imageId: storageId!,
        published: false,
      });

      const artwork = await t.query(api.artworks.get, { id });
      expect(artwork?.order).toBe(6);
    });

    it("throws without valid token", async () => {
      const t = createTestContext();

      let storageId: Id<"_storage"> | undefined;
      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
      });

      await expect(
        t.mutation(api.artworks.create, {
          token: "invalid",
          title: "New",
          imageId: storageId!,
          published: false,
        })
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("updates artwork fields", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Original",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
        });
      });

      await t.mutation(api.artworks.update, {
        token: validToken,
        id: artworkId!,
        title: "Updated",
        published: true,
      });

      const artwork = await t.query(api.artworks.get, { id: artworkId! });
      expect(artwork?.title).toBe("Updated");
      expect(artwork?.published).toBe(true);
    });
  });

  describe("remove", () => {
    it("deletes artwork", async () => {
      vi.useFakeTimers();
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "To Delete",
          imageId: storageId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
      });

      await t.mutation(api.artworks.remove, {
        token: validToken,
        id: artworkId!,
      });

      // Wait for scheduled functions (cleanupTiles) to complete
      await t.finishAllScheduledFunctions(() => vi.advanceTimersByTime(1));

      const artwork = await t.query(api.artworks.get, { id: artworkId! });
      expect(artwork).toBeNull();

      vi.useRealTimers();
    });
  });

  describe("reorder", () => {
    it("updates order of artworks", async () => {
      const t = createTestContext();

      let id1: Id<"artworks"> | undefined;
      let id2: Id<"artworks"> | undefined;
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        id1 = await ctx.db.insert("artworks", {
          title: "First",
          imageId: storageId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
        id2 = await ctx.db.insert("artworks", {
          title: "Second",
          imageId: storageId,
          order: 1,
          published: true,
          createdAt: Date.now(),
        });
      });

      // Reorder: swap positions
      await t.mutation(api.artworks.reorder, {
        token: validToken,
        ids: [id2!, id1!],
      });

      const art1 = await t.query(api.artworks.get, { id: id1! });
      const art2 = await t.query(api.artworks.get, { id: id2! });

      expect(art1?.order).toBe(1);
      expect(art2?.order).toBe(0);
    });
  });
});

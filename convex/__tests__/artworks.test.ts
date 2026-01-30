import { describe, it, expect, beforeEach, vi } from "vitest";
import { api } from "../_generated/api";
import { createTestContext, createTestBlob, Id } from "./setup";

describe("artworks", () => {
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

    it("returns all artworks with collectionCount", async () => {
      const t = createTestContext();

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
      expect(result[0].collectionCount).toBe(0);
    });

    it("filters by collection via junction table", async () => {
      const t = createTestContext();

      let collectionId: Id<"collections"> | undefined;
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        collectionId = await ctx.db.insert("collections", {
          name: "Test Collection",
          slug: "test",
          order: 0,
        });
        const artworkId = await ctx.db.insert("artworks", {
          title: "In Collection",
          imageId: storageId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
        await ctx.db.insert("artworkCollections", {
          artworkId,
          collectionId: collectionId!,
          order: 0,
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
      expect(result[0].collectionCount).toBe(1);
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
    it("creates artwork and junction entry when collectionId provided", async () => {
      const t = createTestContext();

      let storageId: Id<"_storage"> | undefined;
      let collectionId: Id<"collections"> | undefined;
      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
        collectionId = await ctx.db.insert("collections", {
          name: "Test",
          slug: "test",
          order: 0,
        });
      });

      const id = await t.mutation(api.artworks.create, {
        token: validToken,
        title: "New Artwork",
        imageId: storageId!,
        collectionId: collectionId!,
        published: false,
      });

      expect(id).toBeDefined();

      const artwork = await t.query(api.artworks.get, { id });
      expect(artwork?.title).toBe("New Artwork");
      // collectionId should NOT be on the artwork itself
      expect(artwork?.collectionId).toBeUndefined();

      // Verify junction entry
      const listed = await t.query(api.artworks.list, { collectionId: collectionId! });
      expect(listed).toHaveLength(1);
      expect(listed[0]._id).toBe(id);
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
    it("deletes artwork and junction entries", async () => {
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
        const collectionId = await ctx.db.insert("collections", {
          name: "Test",
          slug: "test",
          order: 0,
        });
        await ctx.db.insert("artworkCollections", {
          artworkId: artworkId!,
          collectionId,
          order: 0,
        });
      });

      await t.mutation(api.artworks.remove, {
        token: validToken,
        id: artworkId!,
      });

      await t.finishAllScheduledFunctions(() => vi.advanceTimersByTime(1));

      const artwork = await t.query(api.artworks.get, { id: artworkId! });
      expect(artwork).toBeNull();

      // Junction entries should be cleaned up
      const listed = await t.query(api.artworks.list, {});
      expect(listed).toHaveLength(0);

      vi.useRealTimers();
    });
  });

  describe("addToCollection", () => {
    it("adds artwork to collection", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let collectionId: Id<"collections"> | undefined;
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
        collectionId = await ctx.db.insert("collections", {
          name: "Test",
          slug: "test",
          order: 0,
        });
      });

      await t.mutation(api.artworks.addToCollection, {
        token: validToken,
        artworkId: artworkId!,
        collectionId: collectionId!,
      });

      const listed = await t.query(api.artworks.list, { collectionId: collectionId! });
      expect(listed).toHaveLength(1);
      expect(listed[0]._id).toBe(artworkId!);
    });

    it("throws on duplicate", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let collectionId: Id<"collections"> | undefined;
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        collectionId = await ctx.db.insert("collections", {
          name: "Test",
          slug: "test",
          order: 0,
        });
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
        await ctx.db.insert("artworkCollections", {
          artworkId: artworkId!,
          collectionId: collectionId!,
          order: 0,
        });
      });

      await expect(
        t.mutation(api.artworks.addToCollection, {
          token: validToken,
          artworkId: artworkId!,
          collectionId: collectionId!,
        })
      ).rejects.toThrow("Artwork already in this collection");
    });

    it("requires auth", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let collectionId: Id<"collections"> | undefined;
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
        collectionId = await ctx.db.insert("collections", {
          name: "Test",
          slug: "test",
          order: 0,
        });
      });

      await expect(
        t.mutation(api.artworks.addToCollection, {
          token: "invalid",
          artworkId: artworkId!,
          collectionId: collectionId!,
        })
      ).rejects.toThrow();
    });

    it("sets correct order", async () => {
      const t = createTestContext();

      let artwork1Id: Id<"artworks"> | undefined;
      let artwork2Id: Id<"artworks"> | undefined;
      let collectionId: Id<"collections"> | undefined;
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        collectionId = await ctx.db.insert("collections", {
          name: "Test",
          slug: "test",
          order: 0,
        });
        artwork1Id = await ctx.db.insert("artworks", {
          title: "First",
          imageId: storageId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
        artwork2Id = await ctx.db.insert("artworks", {
          title: "Second",
          imageId: storageId,
          order: 1,
          published: true,
          createdAt: Date.now(),
        });
      });

      await t.mutation(api.artworks.addToCollection, {
        token: validToken,
        artworkId: artwork1Id!,
        collectionId: collectionId!,
      });
      await t.mutation(api.artworks.addToCollection, {
        token: validToken,
        artworkId: artwork2Id!,
        collectionId: collectionId!,
      });

      const listed = await t.query(api.artworks.list, { collectionId: collectionId! });
      expect(listed).toHaveLength(2);
      expect(listed[0].title).toBe("First");
      expect(listed[1].title).toBe("Second");
    });
  });

  describe("removeFromCollection", () => {
    it("removes artwork from collection but keeps artwork", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let collectionId: Id<"collections"> | undefined;
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        collectionId = await ctx.db.insert("collections", {
          name: "Test",
          slug: "test",
          order: 0,
        });
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
        await ctx.db.insert("artworkCollections", {
          artworkId: artworkId!,
          collectionId: collectionId!,
          order: 0,
        });
      });

      await t.mutation(api.artworks.removeFromCollection, {
        token: validToken,
        artworkId: artworkId!,
        collectionId: collectionId!,
      });

      // Artwork still exists
      const artwork = await t.query(api.artworks.get, { id: artworkId! });
      expect(artwork).not.toBeNull();

      // But not in collection
      const listed = await t.query(api.artworks.list, { collectionId: collectionId! });
      expect(listed).toHaveLength(0);
    });

    it("requires auth", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let collectionId: Id<"collections"> | undefined;
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
        collectionId = await ctx.db.insert("collections", {
          name: "Test",
          slug: "test",
          order: 0,
        });
      });

      await expect(
        t.mutation(api.artworks.removeFromCollection, {
          token: "invalid",
          artworkId: artworkId!,
          collectionId: collectionId!,
        })
      ).rejects.toThrow();
    });
  });

  describe("searchByTitle", () => {
    it("returns matching artworks", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        await ctx.db.insert("artworks", {
          title: "Sunset Over Mountains",
          imageId: storageId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
        await ctx.db.insert("artworks", {
          title: "Ocean Waves",
          imageId: storageId,
          order: 1,
          published: true,
          createdAt: Date.now(),
        });
      });

      const results = await t.query(api.artworks.searchByTitle, { query: "sunset" });
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Sunset Over Mountains");
    });

    it("case-insensitive", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        await ctx.db.insert("artworks", {
          title: "Sunset",
          imageId: storageId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
      });

      const results = await t.query(api.artworks.searchByTitle, { query: "SUNSET" });
      expect(results).toHaveLength(1);
    });

    it("returns empty for empty query", async () => {
      const t = createTestContext();
      const results = await t.query(api.artworks.searchByTitle, { query: "" });
      expect(results).toEqual([]);
    });

    it("marks already-in-collection artworks", async () => {
      const t = createTestContext();

      let collectionId: Id<"collections"> | undefined;
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        collectionId = await ctx.db.insert("collections", {
          name: "Test",
          slug: "test",
          order: 0,
        });
        const artworkId = await ctx.db.insert("artworks", {
          title: "Already Added",
          imageId: storageId,
          order: 0,
          published: true,
          createdAt: Date.now(),
        });
        await ctx.db.insert("artworkCollections", {
          artworkId,
          collectionId: collectionId!,
          order: 0,
        });
        await ctx.db.insert("artworks", {
          title: "Not Added",
          imageId: storageId,
          order: 1,
          published: true,
          createdAt: Date.now(),
        });
      });

      const results = await t.query(api.artworks.searchByTitle, {
        query: "Added",
        collectionId: collectionId!,
      });
      expect(results).toHaveLength(2);
      const already = results.find((r) => r.title === "Already Added");
      const notAdded = results.find((r) => r.title === "Not Added");
      expect(already?.alreadyInCollection).toBe(true);
      expect(notAdded?.alreadyInCollection).toBe(false);
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

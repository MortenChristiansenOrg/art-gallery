import { describe, it, expect, beforeEach, vi } from "vitest";
import { api } from "../_generated/api";
import { createTestContext, createTestBlob, Id } from "./setup";

describe("collections", () => {
  const validToken = btoa(`${Date.now()}:validhash`);

  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", "test-password");
  });

  describe("list", () => {
    it("returns empty array when no collections", async () => {
      const t = createTestContext();
      const result = await t.query(api.collections.list, {});
      expect(result).toEqual([]);
    });

    it("returns all collections sorted by order", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        await ctx.db.insert("collections", {
          name: "Second",
          slug: "second",
          order: 2,
        });
        await ctx.db.insert("collections", {
          name: "First",
          slug: "first",
          order: 1,
        });
      });

      const result = await t.query(api.collections.list, {});
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("First");
      expect(result[1].name).toBe("Second");
    });
  });

  describe("listWithCounts", () => {
    it("includes artwork counts via junction table", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        const collectionId = await ctx.db.insert("collections", {
          name: "Test",
          slug: "test",
          order: 0,
        });
        const storageId = await ctx.storage.store(createTestBlob());
        const art1 = await ctx.db.insert("artworks", {
          title: "Art 1",
          imageId: storageId,
          thumbnailId: storageId,
          order: 0,
          published: true,
          dziStatus: "complete",
          createdAt: Date.now(),
        });
        const art2 = await ctx.db.insert("artworks", {
          title: "Art 2",
          imageId: storageId,
          thumbnailId: storageId,
          order: 1,
          published: true,
          dziStatus: "complete",
          createdAt: Date.now(),
        });
        await ctx.db.insert("artworkCollections", {
          artworkId: art1,
          collectionId,
          order: 0,
        });
        await ctx.db.insert("artworkCollections", {
          artworkId: art2,
          collectionId,
          order: 1,
        });
      });

      const result = await t.query(api.collections.listWithCounts, {});
      expect(result[0].artworkCount).toBe(2);
    });

    it("only counts published artworks with thumbnails and complete DZI", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        const collectionId = await ctx.db.insert("collections", {
          name: "Test",
          slug: "test",
          order: 0,
        });
        const storageId = await ctx.storage.store(createTestBlob());
        // Published with thumbnail and complete DZI
        const published = await ctx.db.insert("artworks", {
          title: "Published",
          imageId: storageId,
          thumbnailId: storageId,
          order: 0,
          published: true,
          dziStatus: "complete",
          createdAt: Date.now(),
        });
        // Unpublished
        const unpublished = await ctx.db.insert("artworks", {
          title: "Unpublished",
          imageId: storageId,
          thumbnailId: storageId,
          order: 1,
          published: false,
          dziStatus: "complete",
          createdAt: Date.now(),
        });
        // No thumbnail
        const noThumb = await ctx.db.insert("artworks", {
          title: "No Thumbnail",
          imageId: storageId,
          order: 2,
          published: true,
          createdAt: Date.now(),
        });
        // All in junction table
        await ctx.db.insert("artworkCollections", {
          artworkId: published,
          collectionId,
          order: 0,
        });
        await ctx.db.insert("artworkCollections", {
          artworkId: unpublished,
          collectionId,
          order: 1,
        });
        await ctx.db.insert("artworkCollections", {
          artworkId: noThumb,
          collectionId,
          order: 2,
        });
      });

      const result = await t.query(api.collections.listWithCounts, {});
      expect(result[0].artworkCount).toBe(1);
    });
  });

  describe("getBySlug", () => {
    it("returns collection by slug", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        await ctx.db.insert("collections", {
          name: "Test Collection",
          slug: "test-collection",
          order: 0,
        });
      });

      const result = await t.query(api.collections.getBySlug, {
        slug: "test-collection",
      });
      expect(result?.name).toBe("Test Collection");
    });

    it("returns null for non-existent slug", async () => {
      const t = createTestContext();
      const result = await t.query(api.collections.getBySlug, {
        slug: "non-existent",
      });
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("creates collection with valid token", async () => {
      const t = createTestContext();

      const id = await t.mutation(api.collections.create, {
        token: validToken,
        name: "New Collection",
        slug: "new-collection",
      });

      expect(id).toBeDefined();

      const collection = await t.query(api.collections.getBySlug, {
        slug: "new-collection",
      });
      expect(collection?.name).toBe("New Collection");
    });

    it("sets order to max + 1", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        await ctx.db.insert("collections", {
          name: "Existing",
          slug: "existing",
          order: 3,
        });
      });

      await t.mutation(api.collections.create, {
        token: validToken,
        name: "New",
        slug: "new",
      });

      const collection = await t.query(api.collections.getBySlug, {
        slug: "new",
      });
      expect(collection?.order).toBe(4);
    });

    it("throws without valid token", async () => {
      const t = createTestContext();

      await expect(
        t.mutation(api.collections.create, {
          token: "invalid",
          name: "Test",
          slug: "test",
        })
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("updates collection fields", async () => {
      const t = createTestContext();

      let collectionId: Id<"collections"> | undefined;
      await t.run(async (ctx) => {
        collectionId = await ctx.db.insert("collections", {
          name: "Original",
          slug: "original",
          order: 0,
        });
      });

      await t.mutation(api.collections.update, {
        token: validToken,
        id: collectionId!,
        name: "Updated",
        description: "New description",
      });

      const collection = await t.query(api.collections.getBySlug, {
        slug: "original",
      });
      expect(collection?.name).toBe("Updated");
      expect(collection?.description).toBe("New description");
    });
  });

  describe("remove", () => {
    it("deletes collection and junction entries", async () => {
      const t = createTestContext();

      let collectionId: Id<"collections"> | undefined;
      let artworkId: Id<"artworks"> | undefined;
      await t.run(async (ctx) => {
        collectionId = await ctx.db.insert("collections", {
          name: "To Delete",
          slug: "to-delete",
          order: 0,
        });
        const storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Linked",
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

      await t.mutation(api.collections.remove, {
        token: validToken,
        id: collectionId!,
      });

      // Collection should be deleted
      const collection = await t.query(api.collections.getBySlug, {
        slug: "to-delete",
      });
      expect(collection).toBeNull();

      // Artwork should still exist
      const artwork = await t.query(api.artworks.get, { id: artworkId! });
      expect(artwork).not.toBeNull();

      // But not in any collection (junction entry deleted)
      const listed = await t.query(api.artworks.list, {});
      expect(listed.find((a) => a._id === artworkId!)?.collectionCount).toBe(0);
    });
  });

  describe("reorder", () => {
    it("updates order of collections", async () => {
      const t = createTestContext();

      let id1: Id<"collections"> | undefined;
      let id2: Id<"collections"> | undefined;
      await t.run(async (ctx) => {
        id1 = await ctx.db.insert("collections", {
          name: "First",
          slug: "first",
          order: 0,
        });
        id2 = await ctx.db.insert("collections", {
          name: "Second",
          slug: "second",
          order: 1,
        });
      });

      await t.mutation(api.collections.reorder, {
        token: validToken,
        ids: [id2!, id1!],
      });

      const result = await t.query(api.collections.list, {});
      expect(result[0].name).toBe("Second");
      expect(result[1].name).toBe("First");
    });
  });
});

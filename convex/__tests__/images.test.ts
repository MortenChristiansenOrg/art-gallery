import { describe, it, expect, beforeEach, vi } from "vitest";
import { api } from "../_generated/api";
import { createTestContext, createTestBlob, Id } from "./setup";

describe("images", () => {
  const validToken = btoa(`${Date.now()}:validhash`);

  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", "test-password");
  });

  describe("generateVariants", () => {
    it("skips generation when dziStatus is already generating (idempotency)", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let storageId: Id<"_storage"> | undefined;

      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test Artwork",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating", // Already generating
        });
      });

      // Should return null without throwing (early exit)
      const result = await t.action(api.images.generateVariants, {
        storageId: storageId!,
        artworkId: artworkId!,
      });

      expect(result).toBeNull();
    });

    it("skips generation and returns existing IDs when generating with existing thumbnails", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let storageId: Id<"_storage"> | undefined;
      let existingThumbnailId: Id<"_storage"> | undefined;
      let existingViewerId: Id<"_storage"> | undefined;

      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
        existingThumbnailId = await ctx.storage.store(createTestBlob("thumb"));
        existingViewerId = await ctx.storage.store(createTestBlob("viewer"));
        artworkId = await ctx.db.insert("artworks", {
          title: "Test Artwork",
          imageId: storageId,
          thumbnailId: existingThumbnailId,
          viewerImageId: existingViewerId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
        });
      });

      const result = await t.action(api.images.generateVariants, {
        storageId: storageId!,
        artworkId: artworkId!,
      });

      // Should return existing IDs
      expect(result).toEqual({
        thumbnailId: existingThumbnailId,
        viewerImageId: existingViewerId,
      });
    });

    it("allows generation when dziStatus is failed", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let storageId: Id<"_storage"> | undefined;

      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test Artwork",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "failed", // Previous failure
        });
      });

      // Should attempt generation (will fail due to invalid image data, but that's OK)
      // The important thing is it doesn't return early
      await expect(
        t.action(api.images.generateVariants, {
          storageId: storageId!,
          artworkId: artworkId!,
        })
      ).rejects.toThrow(); // Will fail trying to process invalid blob as image
    });

    it("allows generation when dziStatus is undefined", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let storageId: Id<"_storage"> | undefined;

      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test Artwork",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          // No dziStatus set
        });
      });

      // Should attempt generation (will fail due to invalid image data)
      await expect(
        t.action(api.images.generateVariants, {
          storageId: storageId!,
          artworkId: artworkId!,
        })
      ).rejects.toThrow();
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { api } from "../_generated/api";
import { createTestContext, createTestBlob, Id } from "./setup";

// Suppress "Write outside of transaction" errors from convex-test's internal
// scheduled function tracking. These fire when scheduled actions fail (expected
// with test blobs) and convex-test tries to update _scheduled_functions after tx.
process.removeAllListeners("unhandledRejection");
process.on("unhandledRejection", (reason) => {
  if (reason instanceof Error && reason.message?.includes("Write outside of transaction")) {
    return;
  }
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});

describe("processing", () => {
  const validToken = btoa(`${Date.now()}:validhash`);

  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", "test-password");
  });

  describe("start", () => {
    it("skips when dziStatus is already generating and fresh", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
          dziGenerationStartedAt: Date.now(), // fresh
        });
      });

      await t.mutation(api.processing.start, {
        token: validToken,
        artworkId: artworkId!,
      });

      const artwork = await t.run(async (ctx) => ctx.db.get(artworkId!));
      expect(artwork?.dziStatus).toBe("generating");
    });

    it("allows retry when generation is stale", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
          dziGenerationStartedAt: Date.now() - 11 * 60 * 1000, // 11 min ago
        });
      });

      await t.mutation(api.processing.start, {
        token: validToken,
        artworkId: artworkId!,
      });

      const artwork = await t.run(async (ctx) => ctx.db.get(artworkId!));
      expect(artwork?.dziStatus).toBe("generating");
      expect(Date.now() - (artwork?.dziGenerationStartedAt ?? 0)).toBeLessThan(5000);

      await t.finishInProgressScheduledFunctions();
    });

    it("allows retry from failed state", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "failed",
          processingError: "Previous error",
        });
      });

      await t.mutation(api.processing.start, {
        token: validToken,
        artworkId: artworkId!,
      });

      const artwork = await t.run(async (ctx) => ctx.db.get(artworkId!));
      expect(artwork?.dziStatus).toBe("generating");
      expect(artwork?.processingError).toBeUndefined();

      await t.finishInProgressScheduledFunctions();
    });

    it("allows start from undefined dziStatus", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
        });
      });

      await t.mutation(api.processing.start, {
        token: validToken,
        artworkId: artworkId!,
      });

      const artwork = await t.run(async (ctx) => ctx.db.get(artworkId!));
      expect(artwork?.dziStatus).toBe("generating");
      expect(artwork?.dziGenerationStartedAt).toBeDefined();

      await t.finishInProgressScheduledFunctions();
    });

    it("allows retry when generating with no timestamp (legacy stuck)", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
        });
      });

      await t.mutation(api.processing.start, {
        token: validToken,
        artworkId: artworkId!,
      });

      const artwork = await t.run(async (ctx) => ctx.db.get(artworkId!));
      expect(artwork?.dziStatus).toBe("generating");
      expect(artwork?.dziGenerationStartedAt).toBeDefined();

      await t.finishInProgressScheduledFunctions();
    });

    it("rejects unauthenticated calls", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
        });
      });

      await expect(
        t.mutation(api.processing.start, {
          token: "invalid",
          artworkId: artworkId!,
        })
      ).rejects.toThrow("Unauthorized");
    });
  });
});

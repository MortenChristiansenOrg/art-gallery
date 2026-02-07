import { describe, it, expect, beforeEach, vi } from "vitest";
import { api, internal } from "../_generated/api";
import { createTestContext, createTestBlob, Id } from "./setup";
import { generateTestToken } from "./testHelpers";

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
  let validToken: string;

  beforeEach(async () => {
    vi.stubEnv("ADMIN_PASSWORD", "test-password");
    validToken = await generateTestToken();
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

    it("resumes tiles when variants already exist", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let storageId: Id<"_storage"> | undefined;
      let thumbnailId: Id<"_storage"> | undefined;

      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
        thumbnailId = await ctx.storage.store(createTestBlob());
        const viewerId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "failed",
          thumbnailId,
          viewerImageId: viewerId,
          dziMetadata: {
            width: 1024,
            height: 768,
            tileSize: 512,
            overlap: 1,
            format: "jpg",
            maxLevel: 10,
          },
          tilesTotal: 100,
          tilesCompleted: 50,
        });
      });

      await t.mutation(api.processing.start, {
        token: validToken,
        artworkId: artworkId!,
      });

      const artwork = await t.run(async (ctx) => ctx.db.get(artworkId!));
      expect(artwork?.dziStatus).toBe("generating");
      // Should preserve tile counts (not reset)
      expect(artwork?.tilesTotal).toBe(100);
      expect(artwork?.tilesCompleted).toBe(50);
      expect(artwork?.processingRetryCount).toBe(0);

      await t.finishInProgressScheduledFunctions();
    });

    it("full restart when no variants exist", async () => {
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
          tilesTotal: 100,
          tilesCompleted: 50,
        });
      });

      await t.mutation(api.processing.start, {
        token: validToken,
        artworkId: artworkId!,
      });

      const artwork = await t.run(async (ctx) => ctx.db.get(artworkId!));
      expect(artwork?.dziStatus).toBe("generating");
      // Should reset tile counts (full restart)
      expect(artwork?.tilesTotal).toBeUndefined();
      expect(artwork?.tilesCompleted).toBeUndefined();

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("onVariantsComplete", () => {
    it("saves metadata and schedules first tile batch", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let storageId: Id<"_storage"> | undefined;
      let thumbnailId: Id<"_storage"> | undefined;
      let viewerImageId: Id<"_storage"> | undefined;

      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
        thumbnailId = await ctx.storage.store(createTestBlob());
        viewerImageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
          dziGenerationStartedAt: Date.now(),
        });
      });

      const dziMetadata = {
        width: 1024,
        height: 768,
        tileSize: 512,
        overlap: 1,
        format: "jpg",
        maxLevel: 10,
      };

      await t.mutation(internal.processing.onVariantsComplete, {
        artworkId: artworkId!,
        storageId: storageId!,
        thumbnailId: thumbnailId!,
        viewerImageId: viewerImageId!,
        dziMetadata,
        allTiles: [
          { level: 0, col: 0, row: 0 },
          { level: 1, col: 0, row: 0 },
        ],
      });

      const artwork = await t.run(async (ctx) => ctx.db.get(artworkId!));
      expect(artwork?.thumbnailId).toBe(thumbnailId);
      expect(artwork?.viewerImageId).toBe(viewerImageId);
      expect(artwork?.dziMetadata).toEqual(dziMetadata);
      expect(artwork?.tilesTotal).toBe(2);
      expect(artwork?.tilesCompleted).toBe(0);

      await t.finishInProgressScheduledFunctions();
    });

    it("marks complete immediately when no tiles needed", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let storageId: Id<"_storage"> | undefined;
      let thumbId: Id<"_storage"> | undefined;
      let viewId: Id<"_storage"> | undefined;

      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
        thumbId = await ctx.storage.store(createTestBlob());
        viewId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
          dziGenerationStartedAt: Date.now(),
        });
      });

      await t.mutation(internal.processing.onVariantsComplete, {
        artworkId: artworkId!,
        storageId: storageId!,
        thumbnailId: thumbId!,
        viewerImageId: viewId!,
        dziMetadata: {
          width: 1,
          height: 1,
          tileSize: 512,
          overlap: 1,
          format: "jpg",
          maxLevel: 0,
        },
        allTiles: [],
      });

      const artwork = await t.run(async (ctx) => ctx.db.get(artworkId!));
      expect(artwork?.dziStatus).toBe("complete");
      expect(artwork?.dziGenerationStartedAt).toBeUndefined();
    });
  });

  describe("onBatchComplete", () => {
    it("schedules next batch when remaining tiles exist", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let storageId: Id<"_storage"> | undefined;

      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
          dziGenerationStartedAt: Date.now() - 5000,
          tilesTotal: 10,
          tilesCompleted: 3,
        });
      });

      await t.mutation(internal.processing.onBatchComplete, {
        artworkId: artworkId!,
        storageId: storageId!,
        completedInBatch: 5,
        remainingTiles: [{ level: 5, col: 0, row: 0 }, { level: 5, col: 1, row: 0 }],
        width: 1024,
        height: 768,
        maxLevel: 10,
        batchHadFailures: false,
      });

      const artwork = await t.run(async (ctx) => ctx.db.get(artworkId!));
      expect(artwork?.tilesCompleted).toBe(8); // 3 + 5
      expect(artwork?.dziStatus).toBe("generating");
      // Heartbeat: timestamp should be refreshed
      expect(Date.now() - (artwork?.dziGenerationStartedAt ?? 0)).toBeLessThan(2000);

      await t.finishInProgressScheduledFunctions();
    });

    it("marks complete when no remaining tiles", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let storageId: Id<"_storage"> | undefined;

      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
          dziGenerationStartedAt: Date.now(),
          tilesTotal: 10,
          tilesCompleted: 7,
        });
      });

      await t.mutation(internal.processing.onBatchComplete, {
        artworkId: artworkId!,
        storageId: storageId!,
        completedInBatch: 3,
        remainingTiles: [],
        width: 1024,
        height: 768,
        maxLevel: 10,
        batchHadFailures: false,
      });

      const artwork = await t.run(async (ctx) => ctx.db.get(artworkId!));
      expect(artwork?.dziStatus).toBe("complete");
      expect(artwork?.dziGenerationStartedAt).toBeUndefined();
      expect(artwork?.tilesCompleted).toBe(10);
    });

    it("marks failed when last batch had failures", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let storageId: Id<"_storage"> | undefined;

      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
          dziGenerationStartedAt: Date.now(),
          tilesTotal: 10,
          tilesCompleted: 7,
        });
      });

      await t.mutation(internal.processing.onBatchComplete, {
        artworkId: artworkId!,
        storageId: storageId!,
        completedInBatch: 2,
        remainingTiles: [],
        width: 1024,
        height: 768,
        maxLevel: 10,
        batchHadFailures: true,
      });

      const artwork = await t.run(async (ctx) => ctx.db.get(artworkId!));
      expect(artwork?.dziStatus).toBe("failed");
      expect(artwork?.processingError).toBe("Some tiles failed to generate");
      expect(artwork?.tilesCompleted).toBe(9);
    });
  });

  describe("onResumeReady", () => {
    it("marks complete when no missing tiles", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let storageId: Id<"_storage"> | undefined;

      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
          dziGenerationStartedAt: Date.now(),
          tilesTotal: 50,
          tilesCompleted: 30,
        });
      });

      await t.mutation(internal.processing.onResumeReady, {
        artworkId: artworkId!,
        storageId: storageId!,
        missingTiles: [],
        width: 1024,
        height: 768,
        maxLevel: 10,
      });

      const artwork = await t.run(async (ctx) => ctx.db.get(artworkId!));
      expect(artwork?.dziStatus).toBe("complete");
      expect(artwork?.dziGenerationStartedAt).toBeUndefined();
      expect(artwork?.tilesCompleted).toBe(50);
    });

    it("corrects tilesCompleted and schedules batches for missing tiles", async () => {
      const t = createTestContext();

      let artworkId: Id<"artworks"> | undefined;
      let storageId: Id<"_storage"> | undefined;

      await t.run(async (ctx) => {
        storageId = await ctx.storage.store(createTestBlob());
        artworkId = await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
          dziGenerationStartedAt: Date.now(),
          tilesTotal: 50,
          tilesCompleted: 20, // stale count
        });
      });

      const missingTiles = [
        { level: 8, col: 0, row: 0 },
        { level: 8, col: 1, row: 0 },
        { level: 9, col: 0, row: 0 },
      ];

      await t.mutation(internal.processing.onResumeReady, {
        artworkId: artworkId!,
        storageId: storageId!,
        missingTiles,
        width: 1024,
        height: 768,
        maxLevel: 10,
      });

      const artwork = await t.run(async (ctx) => ctx.db.get(artworkId!));
      // tilesCompleted corrected: 50 total - 3 missing = 47
      expect(artwork?.tilesCompleted).toBe(47);
      expect(artwork?.dziStatus).toBe("generating");

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("onFailed", () => {
    it("sets failed status and error message", async () => {
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
          dziGenerationStartedAt: Date.now(),
        });
      });

      await t.mutation(internal.processing.onFailed, {
        artworkId: artworkId!,
        error: "Out of memory",
      });

      const artwork = await t.run(async (ctx) => ctx.db.get(artworkId!));
      expect(artwork?.dziStatus).toBe("failed");
      expect(artwork?.dziGenerationStartedAt).toBeUndefined();
      expect(artwork?.processingError).toBe("Out of memory");
    });
  });

  describe("checkStuck", () => {
    it("ignores non-generating artworks", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        await ctx.db.insert("artworks", {
          title: "Complete",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "complete",
        });
        await ctx.db.insert("artworks", {
          title: "Failed",
          imageId: storageId,
          order: 1,
          published: false,
          createdAt: Date.now(),
          dziStatus: "failed",
        });
      });

      await t.mutation(internal.processing.checkStuck, {});

      const artworks = await t.run(async (ctx) => ctx.db.query("artworks").collect());
      expect(artworks[0]?.dziStatus).toBe("complete");
      expect(artworks[1]?.dziStatus).toBe("failed");
    });

    it("ignores fresh generating artworks", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
          dziGenerationStartedAt: Date.now(), // fresh
        });
      });

      await t.mutation(internal.processing.checkStuck, {});

      const artwork = await t.run(async (ctx) =>
        (await ctx.db.query("artworks").collect())[0]
      );
      expect(artwork?.dziStatus).toBe("generating");
      expect(artwork?.processingRetryCount).toBeUndefined();
    });

    it("retries stuck artwork with resume when variants exist", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        const thumbId = await ctx.storage.store(createTestBlob());
        const viewerId = await ctx.storage.store(createTestBlob());
        await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
          dziGenerationStartedAt: Date.now() - 11 * 60 * 1000, // 11 min ago
          processingRetryCount: 0,
          thumbnailId: thumbId,
          viewerImageId: viewerId,
          dziMetadata: {
            width: 1024,
            height: 768,
            tileSize: 512,
            overlap: 1,
            format: "jpg",
            maxLevel: 10,
          },
          tilesTotal: 50,
          tilesCompleted: 30,
        });
      });

      await t.mutation(internal.processing.checkStuck, {});

      const artwork = await t.run(async (ctx) =>
        (await ctx.db.query("artworks").collect())[0]
      );
      expect(artwork?.processingRetryCount).toBe(1);
      expect(artwork?.dziStatus).toBe("generating");
      // Timestamp refreshed
      expect(Date.now() - (artwork?.dziGenerationStartedAt ?? 0)).toBeLessThan(2000);
      // Tile counts preserved (resume, not restart)
      expect(artwork?.tilesTotal).toBe(50);
      expect(artwork?.tilesCompleted).toBe(30);

      await t.finishInProgressScheduledFunctions();
    });

    it("retries stuck artwork with full restart when no variants", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
          dziGenerationStartedAt: Date.now() - 11 * 60 * 1000,
          processingRetryCount: 0,
        });
      });

      await t.mutation(internal.processing.checkStuck, {});

      const artwork = await t.run(async (ctx) =>
        (await ctx.db.query("artworks").collect())[0]
      );
      expect(artwork?.processingRetryCount).toBe(1);
      expect(artwork?.dziStatus).toBe("generating");

      await t.finishInProgressScheduledFunctions();
    });

    it("marks failed after exhausting retries", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
          dziGenerationStartedAt: Date.now() - 11 * 60 * 1000,
          processingRetryCount: 3, // already at max
        });
      });

      await t.mutation(internal.processing.checkStuck, {});

      const artwork = await t.run(async (ctx) =>
        (await ctx.db.query("artworks").collect())[0]
      );
      expect(artwork?.dziStatus).toBe("failed");
      expect(artwork?.processingError).toContain("3 retries");
      expect(artwork?.dziGenerationStartedAt).toBeUndefined();
    });

    it("treats missing timestamp as stuck", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        await ctx.db.insert("artworks", {
          title: "Test",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "generating",
          // no dziGenerationStartedAt
          processingRetryCount: 0,
        });
      });

      await t.mutation(internal.processing.checkStuck, {});

      const artwork = await t.run(async (ctx) =>
        (await ctx.db.query("artworks").collect())[0]
      );
      expect(artwork?.processingRetryCount).toBe(1);

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("retryAllIncomplete", () => {
    it("skips complete artworks", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        await ctx.db.insert("artworks", {
          title: "Done",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "complete",
        });
      });

      const result = await t.mutation(internal.processing.retryAllIncomplete, {});
      expect(result).toEqual({ restarted: 0 });
    });

    it("restarts failed artwork without variants (full restart)", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        await ctx.db.insert("artworks", {
          title: "Failed",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "failed",
          tilesTotal: 50,
          tilesCompleted: 20,
        });
      });

      const result = await t.mutation(internal.processing.retryAllIncomplete, {});
      expect(result).toEqual({ restarted: 1 });

      const artwork = await t.run(async (ctx) =>
        (await ctx.db.query("artworks").collect())[0]
      );
      expect(artwork?.dziStatus).toBe("generating");
      expect(artwork?.tilesTotal).toBeUndefined();
      expect(artwork?.tilesCompleted).toBeUndefined();
      expect(artwork?.processingRetryCount).toBe(0);

      await t.finishInProgressScheduledFunctions();
    });

    it("resumes failed artwork with existing variants", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        const thumbId = await ctx.storage.store(createTestBlob());
        const viewerId = await ctx.storage.store(createTestBlob());
        await ctx.db.insert("artworks", {
          title: "Failed",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "failed",
          thumbnailId: thumbId,
          viewerImageId: viewerId,
          dziMetadata: {
            width: 1024,
            height: 768,
            tileSize: 512,
            overlap: 1,
            format: "jpg",
            maxLevel: 10,
          },
          tilesTotal: 50,
          tilesCompleted: 40,
        });
      });

      const result = await t.mutation(internal.processing.retryAllIncomplete, {});
      expect(result).toEqual({ restarted: 1 });

      const artwork = await t.run(async (ctx) =>
        (await ctx.db.query("artworks").collect())[0]
      );
      expect(artwork?.dziStatus).toBe("generating");
      // Tile counts preserved for resume
      expect(artwork?.tilesTotal).toBe(50);
      expect(artwork?.tilesCompleted).toBe(40);

      await t.finishInProgressScheduledFunctions();
    });

    it("handles mix of complete, failed, and pending artworks", async () => {
      const t = createTestContext();

      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(createTestBlob());
        await ctx.db.insert("artworks", {
          title: "Complete",
          imageId: storageId,
          order: 0,
          published: false,
          createdAt: Date.now(),
          dziStatus: "complete",
        });
        await ctx.db.insert("artworks", {
          title: "Failed",
          imageId: storageId,
          order: 1,
          published: false,
          createdAt: Date.now(),
          dziStatus: "failed",
        });
        await ctx.db.insert("artworks", {
          title: "Pending",
          imageId: storageId,
          order: 2,
          published: false,
          createdAt: Date.now(),
          dziStatus: "pending",
        });
      });

      const result = await t.mutation(internal.processing.retryAllIncomplete, {});
      expect(result).toEqual({ restarted: 2 });

      const artworks = await t.run(async (ctx) => ctx.db.query("artworks").collect());
      expect(artworks[0]?.dziStatus).toBe("complete"); // untouched
      expect(artworks[1]?.dziStatus).toBe("generating");
      expect(artworks[2]?.dziStatus).toBe("generating");

      await t.finishInProgressScheduledFunctions();
    });
  });
});

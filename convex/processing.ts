import { ConvexError, v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAuth } from "./auth";

const STUCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const MAX_RETRIES = 3;

/** Smaller batches for larger images to stay within action memory limits. */
function getBatchSize(width: number, height: number): number {
  const mp = (width * height) / 1_000_000;
  if (mp > 100) return 5;
  if (mp > 50) return 10;
  return 20;
}

// --- Pipeline: Mutations (atomic state transitions) ---

/** Entry point. Public mutation — atomic status set + job scheduling. */
export const start = mutation({
  args: {
    token: v.string(),
    artworkId: v.id("artworks"),
  },
  handler: async (ctx, args) => {
    requireAuth(args.token);

    const artwork = await ctx.db.get(args.artworkId);
    if (!artwork) throw new ConvexError("Artwork not found");

    // Idempotency: skip if fresh generating
    if (artwork.dziStatus === "generating") {
      const isStale =
        !artwork.dziGenerationStartedAt ||
        Date.now() - artwork.dziGenerationStartedAt > STUCK_TIMEOUT_MS;
      if (!isStale) return;
    }

    // Resume from tiles if variants already done, otherwise full restart
    const canResume = artwork.dziMetadata && artwork.thumbnailId;

    await ctx.db.patch(args.artworkId, {
      dziStatus: "generating",
      dziGenerationStartedAt: Date.now(),
      ...(canResume ? {} : { tilesTotal: undefined, tilesCompleted: undefined }),
      processingError: undefined,
      processingRetryCount: 0,
    });

    const action = canResume
      ? internal.processingActions.resumeTiles
      : internal.processingActions.processVariants;
    await ctx.scheduler.runAfter(0, action, {
      artworkId: args.artworkId,
      storageId: artwork.imageId,
    });
  },
});

/** Atomic: save variant IDs + DZI metadata + schedule first tile batch. */
export const onVariantsComplete = internalMutation({
  args: {
    artworkId: v.id("artworks"),
    storageId: v.id("_storage"),
    thumbnailId: v.id("_storage"),
    viewerImageId: v.id("_storage"),
    dziMetadata: v.object({
      width: v.number(),
      height: v.number(),
      tileSize: v.number(),
      overlap: v.number(),
      format: v.string(),
      maxLevel: v.number(),
    }),
    allTiles: v.array(
      v.object({ level: v.number(), col: v.number(), row: v.number() })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.artworkId, {
      thumbnailId: args.thumbnailId,
      viewerImageId: args.viewerImageId,
      dziMetadata: args.dziMetadata,
      tilesTotal: args.allTiles.length,
      tilesCompleted: 0,
    });

    const batchSize = getBatchSize(args.dziMetadata.width, args.dziMetadata.height);
    const firstBatch = args.allTiles.slice(0, batchSize);
    const remaining = args.allTiles.slice(batchSize);

    if (firstBatch.length === 0) {
      await ctx.db.patch(args.artworkId, {
        dziStatus: "complete",
        dziGenerationStartedAt: undefined,
      });
      return;
    }

    await ctx.scheduler.runAfter(0, internal.processingActions.generateTileBatch, {
      artworkId: args.artworkId,
      storageId: args.storageId,
      tiles: firstBatch,
      remainingTiles: remaining,
      width: args.dziMetadata.width,
      height: args.dziMetadata.height,
      maxLevel: args.dziMetadata.maxLevel,
    });
  },
});

/** Atomic: heartbeat reset + schedule next batch or mark complete. */
export const onBatchComplete = internalMutation({
  args: {
    artworkId: v.id("artworks"),
    storageId: v.id("_storage"),
    completedInBatch: v.number(),
    remainingTiles: v.array(
      v.object({ level: v.number(), col: v.number(), row: v.number() })
    ),
    width: v.number(),
    height: v.number(),
    maxLevel: v.number(),
    batchHadFailures: v.boolean(),
  },
  handler: async (ctx, args) => {
    const artwork = await ctx.db.get(args.artworkId);
    const tilesCompleted = (artwork?.tilesCompleted ?? 0) + args.completedInBatch;

    if (args.remainingTiles.length > 0) {
      // Heartbeat: reset timestamp so stuck detection uses last progress time
      await ctx.db.patch(args.artworkId, {
        dziGenerationStartedAt: Date.now(),
        tilesCompleted,
      });

      const batchSize = getBatchSize(args.width, args.height);
      const nextBatch = args.remainingTiles.slice(0, batchSize);
      const remaining = args.remainingTiles.slice(batchSize);

      await ctx.scheduler.runAfter(0, internal.processingActions.generateTileBatch, {
        artworkId: args.artworkId,
        storageId: args.storageId,
        tiles: nextBatch,
        remainingTiles: remaining,
        width: args.width,
        height: args.height,
        maxLevel: args.maxLevel,
      });
    } else if (args.batchHadFailures) {
      await ctx.db.patch(args.artworkId, {
        dziStatus: "failed",
        dziGenerationStartedAt: undefined,
        tilesCompleted,
        processingError: "Some tiles failed to generate",
      });
    } else {
      await ctx.db.patch(args.artworkId, {
        dziStatus: "complete",
        dziGenerationStartedAt: undefined,
        tilesCompleted,
      });
    }
  },
});

/** Resume: compute missing tiles and schedule batches for them. */
export const onResumeReady = internalMutation({
  args: {
    artworkId: v.id("artworks"),
    storageId: v.id("_storage"),
    missingTiles: v.array(
      v.object({ level: v.number(), col: v.number(), row: v.number() })
    ),
    width: v.number(),
    height: v.number(),
    maxLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const artwork = await ctx.db.get(args.artworkId);
    if (!artwork) return;

    const existingCount = (artwork.tilesTotal ?? 0) - args.missingTiles.length;

    if (args.missingTiles.length === 0) {
      await ctx.db.patch(args.artworkId, {
        dziStatus: "complete",
        dziGenerationStartedAt: undefined,
        tilesCompleted: artwork.tilesTotal ?? existingCount,
      });
      return;
    }

    await ctx.db.patch(args.artworkId, { tilesCompleted: existingCount });

    const batchSize = getBatchSize(args.width, args.height);
    const firstBatch = args.missingTiles.slice(0, batchSize);
    const remaining = args.missingTiles.slice(batchSize);

    await ctx.scheduler.runAfter(0, internal.processingActions.generateTileBatch, {
      artworkId: args.artworkId,
      storageId: args.storageId,
      tiles: firstBatch,
      remainingTiles: remaining,
      width: args.width,
      height: args.height,
      maxLevel: args.maxLevel,
    });
  },
});

/** Set artwork to "failed" with error message. */
export const onFailed = internalMutation({
  args: {
    artworkId: v.id("artworks"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.artworkId, {
      dziStatus: "failed",
      dziGenerationStartedAt: undefined,
      processingError: args.error,
    });
  },
});

/** Cron target: find artworks stuck in "generating" >10min, auto-retry or mark failed. */
export const checkStuck = internalMutation({
  args: {},
  handler: async (ctx) => {
    const artworks = await ctx.db
      .query("artworks")
      .withIndex("by_dziStatus", (q) => q.eq("dziStatus", "generating"))
      .collect();
    const now = Date.now();
    for (const artwork of artworks) {
      const elapsed = artwork.dziGenerationStartedAt
        ? now - artwork.dziGenerationStartedAt
        : Infinity;
      if (elapsed > STUCK_TIMEOUT_MS) {
        const retryCount = artwork.processingRetryCount ?? 0;
        if (retryCount < MAX_RETRIES) {
          console.log(
            `Retrying artwork ${artwork._id} (attempt ${retryCount + 1}/${MAX_RETRIES}, stuck ${Math.round(elapsed / 1000)}s)`
          );
          await ctx.db.patch(artwork._id, {
            dziGenerationStartedAt: Date.now(),
            processingRetryCount: retryCount + 1,
          });
          const action = artwork.dziMetadata && artwork.thumbnailId
            ? internal.processingActions.resumeTiles
            : internal.processingActions.processVariants;
          await ctx.scheduler.runAfter(0, action, {
            artworkId: artwork._id,
            storageId: artwork.imageId,
          });
        } else {
          console.log(
            `Marking artwork ${artwork._id} as failed (exhausted ${MAX_RETRIES} retries)`
          );
          await ctx.db.patch(artwork._id, {
            dziStatus: "failed",
            dziGenerationStartedAt: undefined,
            processingError: `Processing timed out after ${MAX_RETRIES} retries`,
          });
        }
      }
    }
  },
});

/** One-time recovery: restart all non-complete artworks. Run from dashboard. */
export const retryAllIncomplete = internalMutation({
  args: {},
  handler: async (ctx) => {
    const artworks = await ctx.db.query("artworks").collect();
    let count = 0;
    for (const artwork of artworks) {
      if (artwork.dziStatus === "complete") continue;
      if (!artwork.imageId) continue;

      const canResume = artwork.dziMetadata && artwork.thumbnailId;
      await ctx.db.patch(artwork._id, {
        dziStatus: "generating",
        dziGenerationStartedAt: Date.now(),
        ...(canResume ? {} : { tilesTotal: undefined, tilesCompleted: undefined }),
        processingError: undefined,
        processingRetryCount: 0,
      });

      const action = canResume
        ? internal.processingActions.resumeTiles
        : internal.processingActions.processVariants;
      await ctx.scheduler.runAfter(count * 100, action, {
        artworkId: artwork._id,
        storageId: artwork.imageId,
      });
      count++;
    }
    return { restarted: count };
  },
});

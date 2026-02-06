"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Jimp } from "jimp";

// --- Constants ---
const THUMBNAIL_MAX = 600;
const THUMBNAIL_QUALITY = 85;
const VIEWER_MAX = 2000;
const VIEWER_QUALITY = 90;
const TILE_SIZE = 512;
const TILE_OVERLAP = 1;
const TILE_QUALITY = 85;

// --- DZI Utility Functions ---

interface TileSpec {
  level: number;
  col: number;
  row: number;
}

function calculateMaxLevel(width: number, height: number): number {
  return Math.ceil(Math.log2(Math.max(width, height)));
}

function getLevelDimensions(
  width: number,
  height: number,
  level: number,
  maxLevel: number
): { width: number; height: number } {
  const scale = Math.pow(2, level - maxLevel);
  return {
    width: Math.ceil(width * scale),
    height: Math.ceil(height * scale),
  };
}

function getTilesForLevel(
  levelWidth: number,
  levelHeight: number,
  level: number
): TileSpec[] {
  const tiles: TileSpec[] = [];
  const cols = Math.ceil(levelWidth / TILE_SIZE);
  const rows = Math.ceil(levelHeight / TILE_SIZE);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      tiles.push({ level, col, row });
    }
  }
  return tiles;
}

function getAllTileSpecs(width: number, height: number): TileSpec[] {
  const maxLevel = calculateMaxLevel(width, height);
  const allTiles: TileSpec[] = [];
  for (let level = 0; level <= maxLevel; level++) {
    const dims = getLevelDimensions(width, height, level, maxLevel);
    allTiles.push(...getTilesForLevel(dims.width, dims.height, level));
  }
  return allTiles;
}

async function resizeVariant(
  source: Awaited<ReturnType<typeof Jimp.read>>,
  maxDimension: number,
  quality: number
): Promise<Buffer> {
  const image = source.clone();
  const { width, height } = image;
  if (width <= maxDimension && height <= maxDimension) {
    return await image.getBuffer("image/jpeg", { quality });
  }
  const aspectRatio = width / height;
  if (width > height) {
    image.resize({ w: maxDimension, h: Math.round(maxDimension / aspectRatio) });
  } else {
    image.resize({ w: Math.round(maxDimension * aspectRatio), h: maxDimension });
  }
  return await image.getBuffer("image/jpeg", { quality });
}

/** Extract tile pixels directly from source — O(tileSize) memory, not O(imageSize). */
async function extractTile(
  source: Awaited<ReturnType<typeof Jimp.read>>,
  col: number,
  row: number,
  levelWidth: number,
  levelHeight: number
): Promise<Buffer> {
  const x = col * TILE_SIZE - (col > 0 ? TILE_OVERLAP : 0);
  const y = row * TILE_SIZE - (row > 0 ? TILE_OVERLAP : 0);
  const w = Math.min(
    TILE_SIZE + (col > 0 ? TILE_OVERLAP : 0) + TILE_OVERLAP,
    levelWidth - x
  );
  const h = Math.min(
    TILE_SIZE + (row > 0 ? TILE_OVERLAP : 0) + TILE_OVERLAP,
    levelHeight - y
  );

  // Copy pixel region directly instead of cloning full image
  const tile = new Jimp({ width: w, height: h });
  const srcData = source.bitmap.data;
  const dstData = tile.bitmap.data;
  for (let r = 0; r < h; r++) {
    const srcOff = ((y + r) * source.bitmap.width + x) * 4;
    dstData.set(srcData.subarray(srcOff, srcOff + w * 4), r * w * 4);
  }
  return await tile.getBuffer("image/jpeg", { quality: TILE_QUALITY });
}

// --- Pipeline: Actions (do work, then call back into mutations) ---

/** Download image, clean old tiles, generate thumbnail + viewer, call onVariantsComplete. */
export const processVariants = internalAction({
  args: {
    artworkId: v.id("artworks"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    try {
      // Guard: verify artwork still uses this image
      const artwork = await ctx.runQuery(internal.tiles.getArtworkInternal, {
        artworkId: args.artworkId,
      });
      if (!artwork || artwork.imageId !== args.storageId) return;

      // Clean old tiles
      await ctx.runMutation(internal.tiles.deleteAllForArtwork, {
        artworkId: args.artworkId,
      });

      // Download image
      const imageUrl = await ctx.storage.getUrl(args.storageId);
      if (!imageUrl) throw new Error("Image not found in storage");

      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to download image");
      const imageBuffer = Buffer.from(await response.arrayBuffer());

      const image = await Jimp.read(imageBuffer);
      const width = image.width;
      const height = image.height;

      // Generate thumbnail + viewer (clone from decoded image, no re-decode)
      const thumbnailBuffer = await resizeVariant(image, THUMBNAIL_MAX, THUMBNAIL_QUALITY);
      const viewerBuffer = await resizeVariant(image, VIEWER_MAX, VIEWER_QUALITY);

      const thumbnailId = await ctx.storage.store(
        new Blob([new Uint8Array(thumbnailBuffer)], { type: "image/jpeg" })
      );
      const viewerImageId = await ctx.storage.store(
        new Blob([new Uint8Array(viewerBuffer)], { type: "image/jpeg" })
      );

      const maxLevel = calculateMaxLevel(width, height);
      const allTiles = getAllTileSpecs(width, height);

      // Atomic: save variants + schedule first tile batch
      await ctx.runMutation(internal.processing.onVariantsComplete, {
        artworkId: args.artworkId,
        storageId: args.storageId,
        thumbnailId,
        viewerImageId,
        dziMetadata: {
          width,
          height,
          tileSize: TILE_SIZE,
          overlap: TILE_OVERLAP,
          format: "jpg",
          maxLevel,
        },
        allTiles,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error in processVariants";
      console.error(`processVariants failed for ${args.artworkId}:`, err);
      await ctx.runMutation(internal.processing.onFailed, {
        artworkId: args.artworkId,
        error: message,
      });
    }
  },
});

/** Process a batch of tiles, then call onBatchComplete. */
export const generateTileBatch = internalAction({
  args: {
    artworkId: v.id("artworks"),
    storageId: v.id("_storage"),
    tiles: v.array(
      v.object({ level: v.number(), col: v.number(), row: v.number() })
    ),
    remainingTiles: v.array(
      v.object({ level: v.number(), col: v.number(), row: v.number() })
    ),
    width: v.number(),
    height: v.number(),
    maxLevel: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      const artwork = await ctx.runQuery(internal.tiles.getArtworkInternal, {
        artworkId: args.artworkId,
      });
      if (!artwork || artwork.imageId !== args.storageId) return;

      // Decode original image once for the entire batch
      const imageUrl = await ctx.storage.getUrl(args.storageId);
      if (!imageUrl) throw new Error("Image not found");
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to download image");
      const image = await Jimp.read(Buffer.from(await response.arrayBuffer()));

      // Group tiles by level to resize once per level
      const tilesByLevel = new Map<number, TileSpec[]>();
      for (const tile of args.tiles) {
        const arr = tilesByLevel.get(tile.level);
        if (arr) arr.push(tile);
        else tilesByLevel.set(tile.level, [tile]);
      }

      let failedCount = 0;
      for (const [level, tiles] of tilesByLevel) {
        const scale = Math.pow(2, level - args.maxLevel);
        const levelWidth = Math.ceil(args.width * scale);
        const levelHeight = Math.ceil(args.height * scale);

        // At max level use original directly; otherwise clone + resize once
        let levelImage: Awaited<ReturnType<typeof Jimp.read>>;
        if (scale < 1) {
          levelImage = image.clone();
          levelImage.resize({ w: levelWidth, h: levelHeight });
        } else {
          levelImage = image;
        }

        for (const tileSpec of tiles) {
          try {
            // Direct pixel extraction — O(tileSize) memory, no full-image clone
            const tileBuffer = await extractTile(
              levelImage,
              tileSpec.col,
              tileSpec.row,
              levelWidth,
              levelHeight
            );
            const tileStorageId = await ctx.storage.store(
              new Blob([new Uint8Array(tileBuffer)], { type: "image/jpeg" })
            );
            await ctx.runMutation(internal.tiles.createTile, {
              artworkId: args.artworkId,
              level: tileSpec.level,
              col: tileSpec.col,
              row: tileSpec.row,
              storageId: tileStorageId,
            });
          } catch (err) {
            failedCount++;
            console.error(
              `Tile ${tileSpec.level}/${tileSpec.col}_${tileSpec.row} failed:`,
              err
            );
          }
        }
      }

      if (failedCount === args.tiles.length) {
        await ctx.runMutation(internal.processing.onFailed, {
          artworkId: args.artworkId,
          error: `All ${failedCount} tiles in batch failed`,
        });
        return;
      }

      await ctx.runMutation(internal.processing.onBatchComplete, {
        artworkId: args.artworkId,
        storageId: args.storageId,
        completedInBatch: args.tiles.length - failedCount,
        remainingTiles: args.remainingTiles,
        width: args.width,
        height: args.height,
        maxLevel: args.maxLevel,
        batchHadFailures: failedCount > 0,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error in generateTileBatch";
      console.error(`Tile batch failed for ${args.artworkId}:`, err);
      await ctx.runMutation(internal.processing.onFailed, {
        artworkId: args.artworkId,
        error: message,
      });
    }
  },
});

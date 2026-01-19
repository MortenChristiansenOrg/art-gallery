"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { Jimp } from "jimp";

const TILE_SIZE = 512;
const TILE_OVERLAP = 1;
const TILE_QUALITY = 85;
const BATCH_SIZE = 20;

interface TileSpec {
  level: number;
  col: number;
  row: number;
}

// Calculate DZI pyramid levels
function calculateMaxLevel(width: number, height: number): number {
  const maxDim = Math.max(width, height);
  return Math.ceil(Math.log2(maxDim));
}

// Get dimensions at a specific level
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

// Calculate all tiles needed for a level
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

// Generate all tile specs for an image
function getAllTileSpecs(width: number, height: number): TileSpec[] {
  const maxLevel = calculateMaxLevel(width, height);
  const allTiles: TileSpec[] = [];

  // Generate tiles for each level (from 0 to maxLevel)
  for (let level = 0; level <= maxLevel; level++) {
    const { width: levelWidth, height: levelHeight } = getLevelDimensions(
      width,
      height,
      level,
      maxLevel
    );
    const levelTiles = getTilesForLevel(levelWidth, levelHeight, level);
    allTiles.push(...levelTiles);
  }

  return allTiles;
}

// Start DZI generation for an artwork
export const startGeneration = action({
  args: {
    artworkId: v.id("artworks"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Get image dimensions
    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Image not found");

    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to download image");
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    const image = await Jimp.read(imageBuffer);
    const width = image.width;
    const height = image.height;
    const maxLevel = calculateMaxLevel(width, height);

    // Set metadata and status
    await ctx.runMutation(internal.tiles.setDziMetadata, {
      artworkId: args.artworkId,
      metadata: {
        width,
        height,
        tileSize: TILE_SIZE,
        overlap: TILE_OVERLAP,
        format: "jpg",
        maxLevel,
      },
    });

    await ctx.runMutation(internal.tiles.setDziStatus, {
      artworkId: args.artworkId,
      status: "generating",
    });

    // Calculate all tiles
    const allTiles = getAllTileSpecs(width, height);

    // Start first batch
    await ctx.scheduler.runAfter(0, internal.dzi.generateBatch, {
      artworkId: args.artworkId,
      storageId: args.storageId,
      tiles: allTiles.slice(0, BATCH_SIZE),
      remainingTiles: allTiles.slice(BATCH_SIZE),
      width,
      height,
      maxLevel,
    });
  },
});

// Generate a batch of tiles
export const generateBatch = internalAction({
  args: {
    artworkId: v.id("artworks"),
    storageId: v.id("_storage"),
    tiles: v.array(
      v.object({
        level: v.number(),
        col: v.number(),
        row: v.number(),
      })
    ),
    remainingTiles: v.array(
      v.object({
        level: v.number(),
        col: v.number(),
        row: v.number(),
      })
    ),
    width: v.number(),
    height: v.number(),
    maxLevel: v.number(),
  },
  handler: async (ctx, args) => {
    // Download original image
    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Image not found");

    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to download image");
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Process each tile in this batch
    for (const tileSpec of args.tiles) {
      try {
        const tileBuffer = await generateTile(
          imageBuffer,
          args.width,
          args.height,
          args.maxLevel,
          tileSpec.level,
          tileSpec.col,
          tileSpec.row
        );

        // Store tile
        const tileBlob = new Blob([tileBuffer], { type: "image/jpeg" });
        const tileStorageId = await ctx.storage.store(tileBlob);

        // Record tile in DB
        await ctx.runMutation(internal.tiles.createTile, {
          artworkId: args.artworkId,
          level: tileSpec.level,
          col: tileSpec.col,
          row: tileSpec.row,
          storageId: tileStorageId,
        });
      } catch (err) {
        console.error(
          `Failed to generate tile ${tileSpec.level}/${tileSpec.col}_${tileSpec.row}:`,
          err
        );
        // Continue with other tiles
      }
    }

    // Schedule next batch or mark complete
    if (args.remainingTiles.length > 0) {
      await ctx.scheduler.runAfter(0, internal.dzi.generateBatch, {
        artworkId: args.artworkId,
        storageId: args.storageId,
        tiles: args.remainingTiles.slice(0, BATCH_SIZE),
        remainingTiles: args.remainingTiles.slice(BATCH_SIZE),
        width: args.width,
        height: args.height,
        maxLevel: args.maxLevel,
      });
    } else {
      // Mark complete
      await ctx.runMutation(internal.tiles.setDziStatus, {
        artworkId: args.artworkId,
        status: "complete",
      });
    }
  },
});

// Generate a single tile
async function generateTile(
  imageBuffer: Buffer,
  originalWidth: number,
  originalHeight: number,
  maxLevel: number,
  level: number,
  col: number,
  row: number
): Promise<Buffer> {
  const image = await Jimp.read(imageBuffer);

  // Calculate scale for this level
  const scale = Math.pow(2, level - maxLevel);
  const levelWidth = Math.ceil(originalWidth * scale);
  const levelHeight = Math.ceil(originalHeight * scale);

  // Resize image to this level's size
  if (scale < 1) {
    image.resize({ w: levelWidth, h: levelHeight });
  }

  // Calculate tile bounds with overlap
  const x = col * TILE_SIZE - (col > 0 ? TILE_OVERLAP : 0);
  const y = row * TILE_SIZE - (row > 0 ? TILE_OVERLAP : 0);
  const tileWidth = Math.min(
    TILE_SIZE + (col > 0 ? TILE_OVERLAP : 0) + TILE_OVERLAP,
    levelWidth - x
  );
  const tileHeight = Math.min(
    TILE_SIZE + (row > 0 ? TILE_OVERLAP : 0) + TILE_OVERLAP,
    levelHeight - y
  );

  // Crop to tile
  image.crop({ x, y, w: tileWidth, h: tileHeight });

  return await image.getBuffer("image/jpeg", { quality: TILE_QUALITY });
}

// Clean up tiles for an artwork (when image replaced or artwork deleted)
export const cleanupTiles = internalAction({
  args: {
    artworkId: v.id("artworks"),
  },
  handler: async (ctx, args) => {
    // Get all tiles
    const tiles = await ctx.runQuery(internal.tiles.listByArtwork, {
      artworkId: args.artworkId,
    });

    // Delete storage and records
    for (const tile of tiles) {
      await ctx.storage.delete(tile.storageId);
      await ctx.runMutation(internal.tiles.deleteTile, { tileId: tile._id });
    }

    // Reset DZI status
    await ctx.runMutation(internal.tiles.setDziStatus, {
      artworkId: args.artworkId,
      status: undefined,
    });
    await ctx.runMutation(internal.tiles.setDziMetadata, {
      artworkId: args.artworkId,
      metadata: undefined,
    });
  },
});

// Migration: generate DZI for existing artworks
export const migrateExistingArtworks = action({
  args: {},
  handler: async (ctx): Promise<{ queued: number; skipped: number }> => {
    const artworks = await ctx.runQuery(internal.tiles.listArtworksWithoutDzi, {});

    let queued = 0;
    let skipped = 0;

    for (const artwork of artworks) {
      if (!artwork.imageId) {
        skipped++;
        continue;
      }

      // Queue DZI generation
      await ctx.scheduler.runAfter(queued * 100, internal.dzi.startGenerationInternal, {
        artworkId: artwork._id,
        storageId: artwork.imageId,
      });
      queued++;
    }

    return { queued, skipped };
  },
});

// Internal version for scheduled execution
export const startGenerationInternal = internalAction({
  args: {
    artworkId: v.id("artworks"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Get image dimensions
    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Image not found");

    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to download image");
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    const image = await Jimp.read(imageBuffer);
    const width = image.width;
    const height = image.height;
    const maxLevel = calculateMaxLevel(width, height);

    // Set metadata and status
    await ctx.runMutation(internal.tiles.setDziMetadata, {
      artworkId: args.artworkId,
      metadata: {
        width,
        height,
        tileSize: TILE_SIZE,
        overlap: TILE_OVERLAP,
        format: "jpg",
        maxLevel,
      },
    });

    await ctx.runMutation(internal.tiles.setDziStatus, {
      artworkId: args.artworkId,
      status: "generating",
    });

    // Calculate all tiles
    const allTiles = getAllTileSpecs(width, height);

    // Start first batch
    await ctx.scheduler.runAfter(0, internal.dzi.generateBatch, {
      artworkId: args.artworkId,
      storageId: args.storageId,
      tiles: allTiles.slice(0, BATCH_SIZE),
      remainingTiles: allTiles.slice(BATCH_SIZE),
      width,
      height,
      maxLevel,
    });
  },
});

"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { Jimp } from "jimp";

const THUMBNAIL_MAX = 600;
const THUMBNAIL_QUALITY = 85;
const VIEWER_MAX = 2000;
const VIEWER_QUALITY = 90;

export const generateVariants = action({
  args: {
    storageId: v.id("_storage"),
    artworkId: v.id("artworks"),
  },
  handler: async (ctx, args): Promise<{ thumbnailId: Id<"_storage">; viewerImageId: Id<"_storage"> }> => {
    // Get the original image URL
    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) {
      throw new Error("Image not found");
    }

    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error("Failed to download image");
    }
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Load image with jimp
    const image = await Jimp.read(imageBuffer);
    const width = image.width;
    const height = image.height;

    // Generate thumbnail (600px max dimension)
    const thumbnailBuffer = await resizeImage(imageBuffer, width, height, THUMBNAIL_MAX, THUMBNAIL_QUALITY);

    // Generate viewer image (2000px max dimension)
    const viewerBuffer = await resizeImage(imageBuffer, width, height, VIEWER_MAX, VIEWER_QUALITY);

    // Upload variants to storage
    const thumbnailBlob = new Blob([thumbnailBuffer], { type: "image/jpeg" });
    const viewerBlob = new Blob([viewerBuffer], { type: "image/jpeg" });

    const thumbnailId = await ctx.storage.store(thumbnailBlob);
    const viewerImageId = await ctx.storage.store(viewerBlob);

    // Update the artwork with variant IDs
    await ctx.runMutation(internal.artworks.updateVariants, {
      artworkId: args.artworkId,
      thumbnailId,
      viewerImageId,
    });

    // Start DZI tile generation
    await ctx.scheduler.runAfter(0, internal.dzi.startGenerationInternal, {
      artworkId: args.artworkId,
      storageId: args.storageId,
    });

    return { thumbnailId, viewerImageId };
  },
});

async function resizeImage(
  buffer: Buffer,
  originalWidth: number,
  originalHeight: number,
  maxDimension: number,
  quality: number
): Promise<Buffer> {
  const image = await Jimp.read(buffer);

  // If image is already smaller than max, just output as JPEG
  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return await image.getBuffer("image/jpeg", { quality });
  }

  // Calculate new dimensions maintaining aspect ratio
  const aspectRatio = originalWidth / originalHeight;
  let newWidth: number;
  let newHeight: number;

  if (originalWidth > originalHeight) {
    newWidth = maxDimension;
    newHeight = Math.round(maxDimension / aspectRatio);
  } else {
    newHeight = maxDimension;
    newWidth = Math.round(maxDimension * aspectRatio);
  }

  // Resize and return as JPEG
  image.resize({ w: newWidth, h: newHeight });
  return await image.getBuffer("image/jpeg", { quality });
}

// Migration: generate variants for existing artworks without thumbnails
export const migrateExistingArtworks = action({
  args: {},
  handler: async (ctx): Promise<{ processed: number; failed: string[] }> => {
    const artworks = await ctx.runQuery(api.artworks.list, { publishedOnly: false });

    const toProcess = artworks.filter(
      (a: { thumbnailId?: Id<"_storage">; imageId: Id<"_storage"> }) => !a.thumbnailId && a.imageId
    );

    let processed = 0;
    const failed: string[] = [];

    for (const artwork of toProcess) {
      try {
        await generateVariantsForArtwork(ctx, artwork.imageId, artwork._id);
        processed++;
      } catch (err) {
        failed.push(`${artwork.title}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    return { processed, failed };
  },
});

// Regenerate all variants (for format changes)
export const regenerateAllVariants = action({
  args: {},
  handler: async (ctx): Promise<{ processed: number; failed: string[] }> => {
    const artworks = await ctx.runQuery(api.artworks.list, { publishedOnly: false });

    let processed = 0;
    const failed: string[] = [];

    for (const artwork of artworks) {
      try {
        await generateVariantsForArtwork(ctx, artwork.imageId, artwork._id);
        processed++;
      } catch (err) {
        failed.push(`${artwork.title}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    return { processed, failed };
  },
});

async function generateVariantsForArtwork(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  storageId: Id<"_storage">,
  artworkId: Id<"artworks">
) {
  const imageUrl = await ctx.storage.getUrl(storageId);
  if (!imageUrl) {
    throw new Error("Image not found");
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Failed to download image");
  }
  const imageBuffer = Buffer.from(await response.arrayBuffer());

  const image = await Jimp.read(imageBuffer);
  const width = image.width;
  const height = image.height;

  const thumbnailBuffer = await resizeImage(imageBuffer, width, height, THUMBNAIL_MAX, THUMBNAIL_QUALITY);
  const viewerBuffer = await resizeImage(imageBuffer, width, height, VIEWER_MAX, VIEWER_QUALITY);

  const thumbnailBlob = new Blob([thumbnailBuffer], { type: "image/jpeg" });
  const viewerBlob = new Blob([viewerBuffer], { type: "image/jpeg" });

  const thumbnailId = await ctx.storage.store(thumbnailBlob);
  const viewerImageId = await ctx.storage.store(viewerBlob);

  await ctx.runMutation(internal.artworks.updateVariants, {
    artworkId,
    thumbnailId,
    viewerImageId,
  });

  // Start DZI tile generation
  await ctx.scheduler.runAfter(0, internal.dzi.startGenerationInternal, {
    artworkId,
    storageId,
  });
}

import type { Id } from "../../convex/_generated/dataModel";

// Match server constants (processingActions.ts:9-15)
const THUMBNAIL_MAX = 600;
const THUMBNAIL_QUALITY = 0.85;
const VIEWER_MAX = 2000;
const VIEWER_QUALITY = 0.90;
const TILE_SIZE = 512;
const TILE_OVERLAP = 1;
const TILE_QUALITY = 0.85;

export interface ProcessingProgress {
  stage: "loading" | "thumbnail" | "viewer" | "tiles" | "done";
  tilesCompleted?: number;
  tilesTotal?: number;
}

export interface ClientProcessingResult {
  thumbnailId: Id<"_storage">;
  viewerImageId: Id<"_storage">;
  dziMetadata: {
    width: number;
    height: number;
    tileSize: number;
    overlap: number;
    format: string;
    maxLevel: number;
  };
  tiles: { level: number; col: number; row: number; storageId: Id<"_storage"> }[];
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality
    );
  });
}

function resizeToCanvas(
  source: HTMLImageElement | HTMLCanvasElement,
  maxDim: number
): HTMLCanvasElement {
  const sw = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const sh = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  let w = sw;
  let h = sh;
  if (w > maxDim || h > maxDim) {
    if (w > h) {
      h = Math.round((maxDim * h) / w);
      w = maxDim;
    } else {
      w = Math.round((maxDim * w) / h);
      h = maxDim;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

export async function processAndUploadLocally(
  file: File,
  uploadBlob: (blob: Blob) => Promise<Id<"_storage">>,
  onProgress: (progress: ProcessingProgress) => void
): Promise<ClientProcessingResult> {
  // 1. Load image
  onProgress({ stage: "loading" });
  const img = await loadImage(file);
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  if (width * height > 100_000_000) {
    throw new Error("Image too large for client-side processing (max ~100MP)");
  }

  // 2. Generate + upload thumbnail
  onProgress({ stage: "thumbnail" });
  const thumbCanvas = resizeToCanvas(img, THUMBNAIL_MAX);
  const thumbBlob = await canvasToBlob(thumbCanvas, THUMBNAIL_QUALITY);
  const thumbnailId = await uploadBlob(thumbBlob);

  // 3. Generate + upload viewer image
  onProgress({ stage: "viewer" });
  const viewerCanvas = resizeToCanvas(img, VIEWER_MAX);
  const viewerBlob = await canvasToBlob(viewerCanvas, VIEWER_QUALITY);
  const viewerImageId = await uploadBlob(viewerBlob);

  // 4. Calculate DZI metadata
  const maxLevel = Math.ceil(Math.log2(Math.max(width, height)));
  const dziMetadata = {
    width,
    height,
    tileSize: TILE_SIZE,
    overlap: TILE_OVERLAP,
    format: "jpg",
    maxLevel,
  };

  // Count total tiles for progress
  let tilesTotal = 0;
  for (let level = 0; level <= maxLevel; level++) {
    const scale = Math.pow(2, level - maxLevel);
    const lw = Math.ceil(width * scale);
    const lh = Math.ceil(height * scale);
    tilesTotal += Math.ceil(lw / TILE_SIZE) * Math.ceil(lh / TILE_SIZE);
  }

  // 5. Generate tiles level by level
  const tiles: ClientProcessingResult["tiles"] = [];
  let tilesCompleted = 0;
  onProgress({ stage: "tiles", tilesCompleted: 0, tilesTotal });

  for (let level = 0; level <= maxLevel; level++) {
    const scale = Math.pow(2, level - maxLevel);
    const levelW = Math.ceil(width * scale);
    const levelH = Math.ceil(height * scale);

    // Draw source resized to level dimensions on a reusable canvas
    const levelCanvas = document.createElement("canvas");
    levelCanvas.width = levelW;
    levelCanvas.height = levelH;
    const levelCtx = levelCanvas.getContext("2d")!;
    levelCtx.drawImage(img, 0, 0, levelW, levelH);

    const cols = Math.ceil(levelW / TILE_SIZE);
    const rows = Math.ceil(levelH / TILE_SIZE);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Match server extractTile math (processingActions.ts:95-99)
        const x = col * TILE_SIZE - (col > 0 ? TILE_OVERLAP : 0);
        const y = row * TILE_SIZE - (row > 0 ? TILE_OVERLAP : 0);
        const tw = Math.min(
          TILE_SIZE + (col > 0 ? TILE_OVERLAP : 0) + TILE_OVERLAP,
          levelW - x
        );
        const th = Math.min(
          TILE_SIZE + (row > 0 ? TILE_OVERLAP : 0) + TILE_OVERLAP,
          levelH - y
        );

        const tileCanvas = document.createElement("canvas");
        tileCanvas.width = tw;
        tileCanvas.height = th;
        const tileCtx = tileCanvas.getContext("2d")!;
        tileCtx.drawImage(levelCanvas, x, y, tw, th, 0, 0, tw, th);

        const tileBlob = await canvasToBlob(tileCanvas, TILE_QUALITY);
        const storageId = await uploadBlob(tileBlob);
        tiles.push({ level, col, row, storageId });

        tilesCompleted++;
        onProgress({ stage: "tiles", tilesCompleted, tilesTotal });
      }
    }
    // levelCanvas is now unreferenced and eligible for GC
  }

  onProgress({ stage: "done" });
  return { thumbnailId, viewerImageId, dziMetadata, tiles };
}

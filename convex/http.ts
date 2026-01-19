import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const http = httpRouter();

// Serve DZI XML manifest
// GET /dzi/{artworkId}.dzi
http.route({
  path: "/dzi/{artworkId}.dzi",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const filename = pathParts[pathParts.length - 1];
    const artworkId = filename.replace(".dzi", "") as Id<"artworks">;

    const artwork = await ctx.runQuery(internal.tiles.getArtworkInternal, {
      artworkId,
    });

    if (!artwork || !artwork.dziMetadata || artwork.dziStatus !== "complete") {
      return new Response("Not found", { status: 404 });
    }

    const { width, height, tileSize, overlap, format } = artwork.dziMetadata;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Image xmlns="http://schemas.microsoft.com/deepzoom/2008"
  Format="${format}"
  Overlap="${overlap}"
  TileSize="${tileSize}">
  <Size Width="${width}" Height="${height}"/>
</Image>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=31536000", // 1 year
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

// Serve tile images
// GET /dzi/{artworkId}_files/{level}/{col}_{row}.jpg
http.route({
  path: "/dzi/{artworkId}_files/{level}/{tile}.jpg",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");

    // Parse: /dzi/{artworkId}_files/{level}/{col}_{row}.jpg
    const tileFilename = pathParts[pathParts.length - 1]; // "0_0.jpg"
    const levelStr = pathParts[pathParts.length - 2]; // "0"
    const filesDir = pathParts[pathParts.length - 3]; // "{artworkId}_files"

    const artworkId = filesDir.replace("_files", "") as Id<"artworks">;
    const level = parseInt(levelStr, 10);
    const tileCoords = tileFilename.replace(".jpg", "").split("_");
    const col = parseInt(tileCoords[0], 10);
    const row = parseInt(tileCoords[1], 10);

    if (isNaN(level) || isNaN(col) || isNaN(row)) {
      return new Response("Bad request", { status: 400 });
    }

    const tile = await ctx.runQuery(internal.tiles.getTileInternal, {
      artworkId,
      level,
      col,
      row,
    });

    if (!tile || !tile.url) {
      return new Response("Not found", { status: 404 });
    }

    // Redirect to actual storage URL
    return Response.redirect(tile.url, 302);
  }),
});

// CORS preflight for DZI endpoints
http.route({
  path: "/dzi/{path}",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

export default http;

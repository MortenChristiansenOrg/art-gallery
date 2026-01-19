import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const http = httpRouter();

// Serve DZI XML manifest
// GET /dzi/{artworkId}.dzi
http.route({
  pathPrefix: "/dzi/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");

    // Handle tile requests: /dzi/{artworkId}_files/{level}/{col}_{row}.jpg
    if (pathParts.length === 5 && pathParts[2].endsWith("_files")) {
      const artworkId = pathParts[2].replace("_files", "") as Id<"artworks">;
      const level = parseInt(pathParts[3], 10);
      const tileFilename = pathParts[4];
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

      return Response.redirect(tile.url, 302);
    }

    // Handle DZI manifest: /dzi/{artworkId}.dzi
    const filename = pathParts[pathParts.length - 1];
    if (!filename.endsWith(".dzi")) {
      return new Response("Not found", { status: 404 });
    }
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

// CORS preflight for DZI endpoints
http.route({
  pathPrefix: "/dzi/",
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

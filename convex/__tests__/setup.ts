import { convexTest } from "convex-test";
import schema from "../schema";
import { Id } from "../_generated/dataModel";

export type { Id };

// Import.meta.glob style lazy module imports
const modules = {
  "../artworks.ts": () => import("../artworks"),
  "../collections.ts": () => import("../collections"),
  "../messages.ts": () => import("../messages"),
  "../auth.ts": () => import("../auth"),
  "../files.ts": () => import("../files"),
  "../images.ts": () => import("../images"),
  "../dzi.ts": () => import("../dzi"),
  "../tiles.ts": () => import("../tiles"),
  "../siteContent.ts": () => import("../siteContent"),
  "../schema.ts": () => import("../schema"),
  "../_generated/api.js": () => import("../_generated/api"),
  "../_generated/server.js": () => import("../_generated/server"),
};

export function createTestContext() {
  return convexTest(schema, modules);
}

// Create a Blob-like object that works with convex-test storage
export function createTestBlob(content = "test"): Blob {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(content);

  return {
    size: buffer.length,
    type: "text/plain",
    arrayBuffer: async () => buffer.buffer,
    slice: () => createTestBlob(content),
    stream: () => new ReadableStream(),
    text: async () => content,
  } as unknown as Blob;
}

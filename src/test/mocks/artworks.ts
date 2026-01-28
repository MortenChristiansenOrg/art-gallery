import type { Id } from "../../../convex/_generated/dataModel";

export interface MockArtwork {
  _id: Id<"artworks">;
  _creationTime: number;
  title: string;
  description?: string;
  imageId: Id<"_storage">;
  thumbnailId?: Id<"_storage">;
  viewerImageId?: Id<"_storage">;
  collectionId?: Id<"collections">;
  year?: number;
  medium?: string;
  dimensions?: string;
  order: number;
  published: boolean;
  createdAt: number;
  dziMetadata?: {
    width: number;
    height: number;
    tileSize: number;
    overlap: number;
    format: string;
    maxLevel: number;
  };
  dziStatus?: "pending" | "generating" | "complete" | "failed";
}

export interface MockArtworkWithUrls extends MockArtwork {
  imageUrl: string | null;
  thumbnailUrl: string | null;
  viewerImageUrl: string | null;
}

let artworkIdCounter = 1;

export function createMockArtwork(
  overrides: Partial<MockArtworkWithUrls> = {}
): MockArtworkWithUrls {
  const id = artworkIdCounter++;
  return {
    _id: `artwork_${id}` as Id<"artworks">,
    _creationTime: Date.now(),
    title: `Test Artwork ${id}`,
    imageId: `image_${id}` as Id<"_storage">,
    thumbnailId: `thumb_${id}` as Id<"_storage">,
    viewerImageId: `viewer_${id}` as Id<"_storage">,
    order: id,
    published: true,
    createdAt: Date.now(),
    imageUrl: `https://example.com/image_${id}.jpg`,
    thumbnailUrl: `https://example.com/thumb_${id}.jpg`,
    viewerImageUrl: `https://example.com/viewer_${id}.jpg`,
    ...overrides,
  };
}

export function createMockArtworkList(count: number): MockArtworkWithUrls[] {
  return Array.from({ length: count }, (_, i) =>
    createMockArtwork({ order: i + 1 })
  );
}

export function resetArtworkIdCounter(): void {
  artworkIdCounter = 1;
}

/**
 * Mock data for E2E tests using ConvexReactClientFake
 * All IDs use proper Convex Id types
 */
import type { Id, Doc } from "../../../convex/_generated/dataModel";

// Helper to create typed Convex IDs (test-only; real IDs are opaque)
function createId<T extends "_storage" | "collections" | "artworks" | "messages" | "siteContent">(
  table: T,
  id: string
): Id<T> {
  return `${table}:${id}` as unknown as Id<T>;
}

// Storage IDs
const storageIds = {
  collection1Cover: createId("_storage", "cover1"),
  collection2Cover: createId("_storage", "cover2"),
  artwork1Image: createId("_storage", "img1"),
  artwork1Thumb: createId("_storage", "thumb1"),
  artwork1Viewer: createId("_storage", "viewer1"),
  artwork2Image: createId("_storage", "img2"),
  artwork2Thumb: createId("_storage", "thumb2"),
  artwork2Viewer: createId("_storage", "viewer2"),
  artwork3Image: createId("_storage", "img3"),
  artwork3Thumb: createId("_storage", "thumb3"),
  artwork3Viewer: createId("_storage", "viewer3"),
} as const;

// Collection IDs
export const collectionIds = {
  landscapes: createId("collections", "landscapes"),
  portraits: createId("collections", "portraits"),
} as const;

// Artwork IDs
export const artworkIds = {
  sunset: createId("artworks", "sunset"),
  mountain: createId("artworks", "mountain"),
  portrait1: createId("artworks", "portrait1"),
} as const;

// Message IDs
export const messageIds = {
  message1: createId("messages", "msg1"),
} as const;

// Site content IDs
export const siteContentIds = {
  about: createId("siteContent", "about"),
} as const;

// Collections
export const collections: Array<Doc<"collections"> & { coverImageUrl: string | null; artworkCount: number }> = [
  {
    _id: collectionIds.landscapes,
    _creationTime: Date.now() - 100000,
    name: "Landscapes",
    description: "Nature and outdoor scenes",
    slug: "landscapes",
    order: 0,
    coverImageId: storageIds.collection1Cover,
    coverImageUrl: "https://picsum.photos/seed/landscapes/800/600",
    artworkCount: 2,
  },
  {
    _id: collectionIds.portraits,
    _creationTime: Date.now() - 50000,
    name: "Portraits",
    description: "Studies of the human form",
    slug: "portraits",
    order: 1,
    coverImageId: storageIds.collection2Cover,
    coverImageUrl: "https://picsum.photos/seed/portraits/800/600",
    artworkCount: 1,
  },
];

// Artworks with URLs
export type ArtworkWithUrls = Doc<"artworks"> & {
  imageUrl: string | null;
  thumbnailUrl: string | null;
  viewerImageUrl: string | null;
  dziUrl: string | null;
};

export const artworks: ArtworkWithUrls[] = [
  {
    _id: artworkIds.sunset,
    _creationTime: Date.now() - 90000,
    title: "Golden Sunset",
    description: "A warm sunset over rolling hills",
    imageId: storageIds.artwork1Image,
    thumbnailId: storageIds.artwork1Thumb,
    viewerImageId: storageIds.artwork1Viewer,
    collectionId: collectionIds.landscapes,
    year: 2024,
    medium: "Oil on canvas",
    dimensions: "24 x 36 inches",
    order: 0,
    published: true,
    createdAt: Date.now() - 90000,
    dziStatus: "complete",
    dziMetadata: {
      width: 4000,
      height: 3000,
      tileSize: 512,
      overlap: 1,
      format: "jpg",
      maxLevel: 12,
    },
    imageUrl: "https://picsum.photos/seed/sunset/800/600",
    thumbnailUrl: "https://picsum.photos/seed/sunset/300/225",
    viewerImageUrl: "https://picsum.photos/seed/sunset/2000/1500",
    dziUrl: `/dzi/${artworkIds.sunset}.dzi`,
  },
  {
    _id: artworkIds.mountain,
    _creationTime: Date.now() - 80000,
    title: "Mountain Peak",
    description: "Snow-capped mountain at dawn",
    imageId: storageIds.artwork2Image,
    thumbnailId: storageIds.artwork2Thumb,
    viewerImageId: storageIds.artwork2Viewer,
    collectionId: collectionIds.landscapes,
    year: 2023,
    medium: "Watercolor",
    dimensions: "18 x 24 inches",
    order: 1,
    published: true,
    createdAt: Date.now() - 80000,
    dziStatus: "complete",
    dziMetadata: {
      width: 3600,
      height: 2700,
      tileSize: 512,
      overlap: 1,
      format: "jpg",
      maxLevel: 11,
    },
    imageUrl: "https://picsum.photos/seed/mountain/800/600",
    thumbnailUrl: "https://picsum.photos/seed/mountain/300/225",
    viewerImageUrl: "https://picsum.photos/seed/mountain/2000/1500",
    dziUrl: `/dzi/${artworkIds.mountain}.dzi`,
  },
  {
    _id: artworkIds.portrait1,
    _creationTime: Date.now() - 70000,
    title: "Study in Light",
    description: "Portrait exploring dramatic lighting",
    imageId: storageIds.artwork3Image,
    thumbnailId: storageIds.artwork3Thumb,
    viewerImageId: storageIds.artwork3Viewer,
    collectionId: collectionIds.portraits,
    year: 2024,
    medium: "Charcoal on paper",
    dimensions: "12 x 16 inches",
    order: 0,
    published: true,
    createdAt: Date.now() - 70000,
    dziStatus: "complete",
    dziMetadata: {
      width: 3200,
      height: 4000,
      tileSize: 512,
      overlap: 1,
      format: "jpg",
      maxLevel: 11,
    },
    imageUrl: "https://picsum.photos/seed/portrait/600/800",
    thumbnailUrl: "https://picsum.photos/seed/portrait/225/300",
    viewerImageUrl: "https://picsum.photos/seed/portrait/1500/2000",
    dziUrl: `/dzi/${artworkIds.portrait1}.dzi`,
  },
];

// Messages
export const messages: Doc<"messages">[] = [
  {
    _id: messageIds.message1,
    _creationTime: Date.now() - 10000,
    name: "Test User",
    email: "test@example.com",
    message: "Love your artwork! Would you consider commissions?",
    read: false,
    createdAt: Date.now() - 10000,
  },
];

// Site content
export const siteContent: Record<string, string> = {
  about: "Welcome to my art gallery. I create paintings and drawings inspired by nature and human connection.\n\nThis is a test gallery for E2E testing purposes.",
};

// Test password for admin auth
export const TEST_PASSWORD = "test-password";

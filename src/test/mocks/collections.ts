import type { Id } from "../../../convex/_generated/dataModel";

export interface MockCollection {
  _id: Id<"collections">;
  _creationTime: number;
  name: string;
  description?: string;
  slug: string;
  order: number;
  coverImageId?: Id<"_storage">;
  iconSvg?: string;
}

export interface MockCollectionWithCount extends MockCollection {
  artworkCount: number;
  coverImageUrl: string | null;
}

let collectionIdCounter = 1;

export function createMockCollection(
  overrides: Partial<MockCollectionWithCount> = {}
): MockCollectionWithCount {
  const id = collectionIdCounter++;
  const name = overrides.name ?? `Collection ${id}`;
  return {
    _id: `collection_${id}` as Id<"collections">,
    _creationTime: Date.now(),
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    order: id,
    artworkCount: 5,
    coverImageUrl: `https://example.com/cover_${id}.jpg`,
    ...overrides,
  };
}

export function createMockCollectionList(
  count: number
): MockCollectionWithCount[] {
  return Array.from({ length: count }, (_, i) =>
    createMockCollection({ order: i + 1 })
  );
}

export function resetCollectionIdCounter(): void {
  collectionIdCounter = 1;
}

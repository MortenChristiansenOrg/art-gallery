import type { Id } from "../../../convex/_generated/dataModel";
import { CollectionCard } from "./CollectionCard";

interface Collection {
  _id: Id<"collections">;
  name: string;
  description?: string;
  slug: string;
  coverImageUrl: string | null;
  artworkCount: number;
}

interface CollectionsGridProps {
  collections: Collection[];
}

export function CollectionsGrid({ collections }: CollectionsGridProps) {
  return (
    <div data-testid="collections-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {collections.map((collection, index) => (
        <CollectionCard
          key={collection._id}
          collection={collection}
          index={index}
        />
      ))}
    </div>
  );
}

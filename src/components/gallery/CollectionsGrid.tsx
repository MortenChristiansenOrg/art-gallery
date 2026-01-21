import type { Id } from "../../../convex/_generated/dataModel";
import { CollectionCard, CabinetCard } from "./CollectionCard";

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
  uncategorizedCount: number;
}

export function CollectionsGrid({ collections, uncategorizedCount }: CollectionsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
      {collections.map((collection, index) => (
        <CollectionCard
          key={collection._id}
          collection={collection}
          index={index}
        />
      ))}
      {uncategorizedCount > 0 && (
        <CabinetCard count={uncategorizedCount} index={collections.length} />
      )}
    </div>
  );
}

import { ArtworkCard } from "./ArtworkCard";
import type { Id } from "../../../convex/_generated/dataModel";

interface Artwork {
  _id: Id<"artworks">;
  title: string;
  imageUrl: string | null;
  thumbnailUrl?: string | null;
  year?: number;
}

interface ArtworkGridProps {
  artworks: Artwork[];
  collectionSlug?: string;
}

export function ArtworkGrid({ artworks, collectionSlug }: ArtworkGridProps) {
  return (
    <div
      className="
        grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
        gap-x-8 gap-y-12 lg:gap-x-10 lg:gap-y-16
      "
    >
      {artworks.map((artwork, index) => (
        <ArtworkCard
          key={artwork._id}
          id={artwork._id}
          title={artwork.title}
          imageUrl={artwork.imageUrl}
          thumbnailUrl={artwork.thumbnailUrl}
          year={artwork.year}
          index={index}
          collectionSlug={collectionSlug}
        />
      ))}
    </div>
  );
}

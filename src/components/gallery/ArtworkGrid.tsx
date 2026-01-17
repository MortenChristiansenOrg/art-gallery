import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { ArtworkCard } from "./ArtworkCard";
import type { Id } from "../../convex/_generated/dataModel";

interface Artwork {
  _id: Id<"artworks">;
  title: string;
  imageUrl: string | null;
  year?: number;
}

interface ArtworkGridProps {
  artworks: Artwork[];
}

export function ArtworkGrid({ artworks }: ArtworkGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const slides = artworks
    .filter((a) => a.imageUrl)
    .map((a) => ({
      src: a.imageUrl!,
      alt: a.title,
    }));

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {artworks.map((artwork, index) => (
          <ArtworkCard
            key={artwork._id}
            id={artwork._id}
            title={artwork.title}
            imageUrl={artwork.imageUrl}
            year={artwork.year}
            onClick={() => setLightboxIndex(index)}
          />
        ))}
      </div>

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={slides}
        styles={{
          container: { backgroundColor: "rgba(0, 0, 0, 0.95)" },
        }}
      />
    </>
  );
}

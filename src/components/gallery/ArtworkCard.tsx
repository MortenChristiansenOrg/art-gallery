import { Link } from "react-router-dom";
import type { Id } from "../../convex/_generated/dataModel";

interface ArtworkCardProps {
  id: Id<"artworks">;
  title: string;
  imageUrl: string | null;
  year?: number;
  onClick?: () => void;
}

export function ArtworkCard({ id, title, imageUrl, year, onClick }: ArtworkCardProps) {
  const content = (
    <div className="group cursor-pointer">
      <div className="aspect-[4/5] overflow-hidden bg-[var(--color-gallery-border)]">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="font-[var(--font-serif)] text-lg">{title}</h3>
        {year && (
          <p className="text-sm text-[var(--color-gallery-muted)]">{year}</p>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }

  return <Link to={`/artwork/${id}`}>{content}</Link>;
}

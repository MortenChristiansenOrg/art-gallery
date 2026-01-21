import { Link } from "react-router-dom";
import type { Id } from "../../../convex/_generated/dataModel";

interface CollectionCardProps {
  collection: {
    _id: Id<"collections">;
    name: string;
    description?: string;
    slug: string;
    coverImageUrl: string | null;
    artworkCount: number;
  };
  index: number;
}

export function CollectionCard({ collection, index }: CollectionCardProps) {
  return (
    <Link
      to={`/collection/${collection.slug}`}
      className="
        group block relative overflow-hidden
        bg-[var(--color-gallery-surface)]
        border border-[var(--color-gallery-border-light)]
        transition-all duration-500 ease-out
        hover:-translate-y-2 hover:shadow-2xl
        opacity-0 animate-fade-in
      "
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Cover image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {collection.coverImageUrl ? (
          <img
            src={collection.coverImageUrl}
            alt={collection.name}
            className="
              w-full h-full object-cover
              transition-transform duration-700 ease-out
              group-hover:scale-105
            "
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-gallery-hover)] flex items-center justify-center">
            <span className="text-[var(--color-gallery-subtle)] text-sm tracking-wide">
              No cover image
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-t from-black/70 via-black/20 to-transparent
            transition-opacity duration-500
            group-hover:opacity-90
          "
        />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h2
            className="
              font-[var(--font-serif)] text-2xl lg:text-3xl
              font-light tracking-wide
              transition-transform duration-500
              group-hover:translate-y-[-4px]
            "
          >
            {collection.name}
          </h2>

          {collection.description && (
            <p
              className="
                mt-2 text-sm text-white/80 font-light
                line-clamp-2
                transition-opacity duration-500
                opacity-80 group-hover:opacity-100
              "
            >
              {collection.description}
            </p>
          )}

          <p
            className="
              mt-3 text-xs tracking-[0.15em] uppercase text-white/60
              font-light
            "
          >
            {collection.artworkCount} {collection.artworkCount === 1 ? "work" : "works"}
          </p>
        </div>
      </div>
    </Link>
  );
}

// Special variant for Cabinet of Curiosities
interface CabinetCardProps {
  count: number;
  index: number;
}

export function CabinetCard({ count, index }: CabinetCardProps) {
  return (
    <Link
      to="/collection/cabinet-of-curiosities"
      className="
        group block relative overflow-hidden
        bg-[var(--color-gallery-surface)]
        border border-[var(--color-gallery-border-light)]
        transition-all duration-500 ease-out
        hover:-translate-y-2 hover:shadow-2xl
        opacity-0 animate-fade-in
      "
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* Pattern background for cabinet */}
        <div
          className="
            w-full h-full
            bg-[var(--color-gallery-text)]
            flex items-center justify-center
          "
        >
          <svg
            className="w-24 h-24 text-[var(--color-gallery-surface)] opacity-20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>

        {/* Gradient overlay */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-t from-black/70 via-black/20 to-transparent
            transition-opacity duration-500
            group-hover:opacity-90
          "
        />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h2
            className="
              font-[var(--font-serif)] text-2xl lg:text-3xl
              font-light tracking-wide italic
              transition-transform duration-500
              group-hover:translate-y-[-4px]
            "
          >
            Cabinet of Curiosities
          </h2>

          <p
            className="
              mt-2 text-sm text-white/80 font-light
              transition-opacity duration-500
              opacity-80 group-hover:opacity-100
            "
          >
            Uncategorized works and experiments
          </p>

          <p
            className="
              mt-3 text-xs tracking-[0.15em] uppercase text-white/60
              font-light
            "
          >
            {count} {count === 1 ? "work" : "works"}
          </p>
        </div>
      </div>
    </Link>
  );
}

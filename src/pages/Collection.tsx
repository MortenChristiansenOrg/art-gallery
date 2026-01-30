import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArtworkGrid } from "../components/gallery";

export function Collection() {
  const { slug } = useParams<{ slug: string }>();

  const collection = useQuery(
    api.collections.getBySlug,
    slug ? { slug } : "skip"
  );

  const artworks = useQuery(
    api.artworks.list,
    collection?._id ? { collectionId: collection._id, publishedOnly: true } : "skip"
  );

  // 404 state
  if (collection === null) {
    return (
      <div className="max-w-6xl mx-auto px-8 lg:px-12 py-32 text-center opacity-0 animate-fade-in">
        <p className="text-[var(--color-gallery-muted)] text-lg font-light">
          Collection not found
        </p>
        <Link
          to="/"
          className="
            inline-block mt-6 text-[0.8rem] tracking-[0.1em] uppercase font-light
            text-[var(--color-gallery-muted)] hover:text-[var(--color-gallery-text)]
            transition-colors duration-300
          "
        >
          Return to collections
        </Link>
      </div>
    );
  }

  // Loading state
  if (artworks === undefined || collection === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-16">
        <div className="space-y-16">
          {/* Back link skeleton */}
          <div className="h-4 w-32 skeleton-shimmer rounded" />

          {/* Header skeleton */}
          <div className="max-w-2xl">
            <div className="h-8 w-48 skeleton-shimmer rounded" />
            <div className="h-4 w-96 skeleton-shimmer rounded mt-4" />
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 lg:gap-x-10 lg:gap-y-16">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-5">
                <div
                  className="
                    bg-[var(--color-gallery-surface)]
                    border border-[var(--color-gallery-border-light)]
                    p-4
                  "
                >
                  <div className="aspect-[4/5] skeleton-shimmer" />
                </div>
                <div className="space-y-2 px-1">
                  <div className="h-4 w-3/4 skeleton-shimmer rounded" />
                  <div className="h-3 w-12 skeleton-shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-8 lg:px-12 py-16 opacity-0 animate-fade-in">
      {/* Back navigation */}
      <nav className="mb-10">
        <Link
          to="/"
          data-testid="back-button"
          className="
            group inline-flex items-center gap-3
            text-[0.8rem] tracking-[0.1em] uppercase font-light
            text-[var(--color-gallery-muted)]
            hover:text-[var(--color-gallery-text)]
            transition-colors duration-300
          "
        >
          <span
            className="
              inline-block w-6 h-[1px] bg-current
              transition-transform duration-300
              group-hover:-translate-x-1
            "
          />
          All collections
        </Link>
      </nav>

      {/* Collection header */}
      <header className="mb-12 max-w-2xl">
        <h1
          className="
            text-3xl lg:text-4xl font-light tracking-wide
            text-[var(--color-gallery-text)]
            font-[var(--font-serif)]
          "
        >
          {collection.name}
        </h1>
        {collection.description && (
          <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--color-gallery-subtle)] font-light">
            {collection.description}
          </p>
        )}
      </header>

      {/* Artwork grid */}
      {artworks && artworks.length > 0 ? (
        <ArtworkGrid artworks={artworks} collectionSlug={slug} nativeAspectRatio={collection.nativeAspectRatio} />
      ) : (
        <div className="flex flex-col items-center justify-center py-32">
          <p
            className="
              text-[var(--color-gallery-subtle)]
              text-[0.9rem] tracking-wide font-light
            "
          >
            No works in this collection
          </p>
        </div>
      )}
    </section>
  );
}

import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ImageViewer } from "../components/gallery";

export function Artwork() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [viewerOpen, setViewerOpen] = useState(false);

  // Get collection slug from navigation state (if coming from collection page)
  const fromCollection = (location.state as { fromCollection?: string } | null)?.fromCollection;

  const artwork = useQuery(
    api.artworks.get,
    id ? { id: id as Id<"artworks">, publishedOnly: true } : "skip"
  );

  const collections = useQuery(api.collections.list);

  if (artwork === undefined) {
    return (
      <div className="max-w-6xl mx-auto px-8 lg:px-12 py-16">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Image skeleton */}
          <div
            className="
              bg-[var(--color-gallery-surface)]
              border border-[var(--color-gallery-border-light)]
              p-6
              lg:flex-1 lg:min-w-0
            "
          >
            <div className="aspect-[3/4] skeleton-shimmer" />
          </div>
          {/* Info skeleton */}
          <div className="lg:w-80 lg:flex-shrink-0 space-y-6">
            <div className="h-8 w-3/4 skeleton-shimmer rounded" />
            <div className="space-y-4 pt-4">
              <div className="h-3 w-16 skeleton-shimmer rounded" />
              <div className="h-3 w-24 skeleton-shimmer rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (artwork === null) {
    return (
      <div className="max-w-6xl mx-auto px-8 lg:px-12 py-32 text-center opacity-0 animate-fade-in">
        <p className="text-[var(--color-gallery-muted)] text-lg font-light">
          Artwork not found
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

  const artworkCollection = collections?.find((c) => c._id === artwork.collectionId);

  // Determine back link
  let backLink = "/";
  let backLabel = "All collections";

  if (fromCollection) {
    backLink = `/collection/${fromCollection}`;
    backLabel = fromCollection === "cabinet-of-curiosities"
      ? "Cabinet of Curiosities"
      : artworkCollection?.name || "Collection";
  } else if (artworkCollection) {
    backLink = `/collection/${artworkCollection.slug}`;
    backLabel = artworkCollection.name;
  } else if (artwork.collectionId === undefined) {
    backLink = "/collection/cabinet-of-curiosities";
    backLabel = "Cabinet of Curiosities";
  }

  return (
    <article className="max-w-6xl mx-auto px-8 lg:px-12 py-12 lg:py-16 opacity-0 animate-fade-in">
      {/* Back navigation */}
      <nav className="mb-10">
        <Link
          to={backLink}
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
          {backLabel}
        </Link>
      </nav>

      {/* Main content layout */}
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Artwork image with frame */}
        <div
          className="
            relative cursor-zoom-in group
            bg-[var(--color-gallery-surface)]
            border border-[var(--color-gallery-border)]
            p-4 sm:p-6
            gallery-frame
            lg:flex-1 lg:min-w-0
          "
          onClick={() => setViewerOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setViewerOpen(true)}
          aria-label="View artwork in fullscreen"
        >
          {(artwork.viewerImageUrl || artwork.imageUrl) ? (
            <img
              src={artwork.viewerImageUrl || artwork.imageUrl!}
              alt={artwork.title}
              className="
                w-full h-auto
                transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
                group-hover:scale-[1.01]
              "
            />
          ) : (
            <div className="aspect-[3/4] flex items-center justify-center bg-[var(--color-gallery-hover)]">
              <span className="text-[var(--color-gallery-subtle)] text-sm tracking-wide">
                No image available
              </span>
            </div>
          )}

          {/* Zoom hint */}
          <div
            className="
              absolute bottom-8 right-8
              opacity-0 group-hover:opacity-100
              transition-opacity duration-300
              pointer-events-none
            "
          >
            <span
              className="
                inline-flex items-center gap-2 px-3 py-1.5
                bg-[var(--color-gallery-text)]/90 text-[var(--color-gallery-surface)]
                text-[0.7rem] tracking-[0.1em] uppercase font-light
                backdrop-blur-sm
              "
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                />
              </svg>
              Enlarge
            </span>
          </div>
        </div>

        {/* Artwork details */}
        <aside className="lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-32 lg:self-start space-y-8">
          {/* Title */}
          <header>
            <h1
              className="
                font-[var(--font-serif)] text-[2rem] lg:text-[2.25rem]
                font-light leading-tight tracking-[0.01em]
              "
            >
              {artwork.title}
            </h1>
            {artwork.year && (
              <p className="mt-2 text-[var(--color-gallery-muted)] text-[0.9rem] font-light">
                {artwork.year}
              </p>
            )}
          </header>

          {/* Divider */}
          <div className="h-[1px] w-12 bg-[var(--color-gallery-border)]" />

          {/* Metadata */}
          <dl className="space-y-4">
            {artwork.medium && (
              <div>
                <dt
                  className="
                    text-[0.7rem] tracking-[0.15em] uppercase
                    text-[var(--color-gallery-subtle)]
                    font-light mb-1
                  "
                >
                  Medium
                </dt>
                <dd className="text-[0.9rem] text-[var(--color-gallery-text)] font-light">
                  {artwork.medium}
                </dd>
              </div>
            )}
            {artwork.dimensions && (
              <div>
                <dt
                  className="
                    text-[0.7rem] tracking-[0.15em] uppercase
                    text-[var(--color-gallery-subtle)]
                    font-light mb-1
                  "
                >
                  Dimensions
                </dt>
                <dd className="text-[0.9rem] text-[var(--color-gallery-text)] font-light">
                  {artwork.dimensions}
                </dd>
              </div>
            )}
            {artworkCollection && (
              <div>
                <dt
                  className="
                    text-[0.7rem] tracking-[0.15em] uppercase
                    text-[var(--color-gallery-subtle)]
                    font-light mb-1
                  "
                >
                  Collection
                </dt>
                <dd>
                  <Link
                    to={`/collection/${artworkCollection.slug}`}
                    className="
                      relative inline-block text-[0.9rem] font-light
                      text-[var(--color-gallery-text)]
                      hover:text-[var(--color-gallery-muted)]
                      transition-colors duration-300
                    "
                  >
                    {artworkCollection.name}
                    <span
                      className="
                        absolute -bottom-0.5 left-0 w-full h-[1px]
                        bg-[var(--color-gallery-border)]
                      "
                    />
                  </Link>
                </dd>
              </div>
            )}
          </dl>

          {/* Description */}
          {artwork.description && (
            <>
              <div className="h-[1px] w-12 bg-[var(--color-gallery-border)]" />
              <p
                className="
                  text-[0.9rem] leading-relaxed font-light
                  text-[var(--color-gallery-muted)]
                "
              >
                {artwork.description}
              </p>
            </>
          )}
        </aside>
      </div>

      {/* Image Viewer - use DZI tiles if available, fall back to viewer image */}
      {(artwork.viewerImageUrl || artwork.imageUrl) && (
        <ImageViewer
          imageUrl={artwork.viewerImageUrl || artwork.imageUrl!}
          dziUrl={artwork.dziUrl}
          title={artwork.title}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </article>
  );
}

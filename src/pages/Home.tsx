import { useQuery } from "convex/react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { ArtworkGrid, SeriesFilter } from "../components/gallery";

export function Home() {
  const [searchParams] = useSearchParams();
  const seriesSlug = searchParams.get("series");

  const allSeries = useQuery(api.series.list);
  const currentSeries = seriesSlug
    ? allSeries?.find((s) => s.slug === seriesSlug)
    : undefined;

  const artworks = useQuery(api.artworks.list, {
    seriesId: currentSeries?._id,
    publishedOnly: true,
  });

  if (artworks === undefined || allSeries === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-16">
        {/* Loading skeleton */}
        <div className="space-y-16">
          {/* Filter skeleton */}
          <div className="flex gap-6 pb-8 border-b border-[var(--color-gallery-border-light)]">
            <div className="h-3 w-12 skeleton-shimmer rounded" />
            <div className="h-3 w-20 skeleton-shimmer rounded" />
            <div className="h-3 w-16 skeleton-shimmer rounded" />
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
    <section className="max-w-7xl mx-auto px-8 lg:px-12 py-16">
      {/* Series filter */}
      {allSeries.length > 0 && <SeriesFilter series={allSeries} />}

      {/* Series header with description */}
      {currentSeries && (
        <div className="mb-12 max-w-2xl">
          <h1 className="text-2xl font-light tracking-wide text-[var(--color-gallery-text)]">
            {currentSeries.name}
          </h1>
          {currentSeries.description && (
            <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--color-gallery-subtle)] font-light">
              {currentSeries.description}
            </p>
          )}
        </div>
      )}

      {/* Gallery grid */}
      {artworks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-0 animate-fade-in">
          <p
            className="
              text-[var(--color-gallery-subtle)]
              text-[0.9rem] tracking-wide font-light
            "
          >
            No works to display
          </p>
          {currentSeries && (
            <p
              className="
                mt-2 text-[var(--color-gallery-subtle)]
                text-[0.8rem] tracking-wide font-light
              "
            >
              Try selecting a different series
            </p>
          )}
        </div>
      ) : (
        <ArtworkGrid artworks={artworks} />
      )}
    </section>
  );
}

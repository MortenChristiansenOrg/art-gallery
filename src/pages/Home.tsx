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
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-6 w-48 bg-[var(--color-gallery-border)] rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[4/5] bg-[var(--color-gallery-border)] rounded" />
                <div className="h-4 w-32 bg-[var(--color-gallery-border)] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {allSeries.length > 0 && <SeriesFilter series={allSeries} />}

      {artworks.length === 0 ? (
        <p className="text-center text-[var(--color-gallery-muted)] py-20">
          No artworks yet
        </p>
      ) : (
        <ArtworkGrid artworks={artworks} />
      )}
    </div>
  );
}

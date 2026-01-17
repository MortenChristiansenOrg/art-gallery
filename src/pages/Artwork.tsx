import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function Artwork() {
  const { id } = useParams<{ id: string }>();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const artwork = useQuery(
    api.artworks.get,
    id ? { id: id as Id<"artworks"> } : "skip"
  );

  const series = useQuery(
    api.series.list
  );

  if (artwork === undefined) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="animate-pulse">
          <div className="aspect-[3/4] max-w-2xl mx-auto bg-[var(--color-gallery-border)] rounded" />
        </div>
      </div>
    );
  }

  if (artwork === null) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 text-center">
        <p className="text-[var(--color-gallery-muted)]">Artwork not found</p>
        <Link to="/" className="text-sm underline mt-4 inline-block">
          Back to gallery
        </Link>
      </div>
    );
  }

  const artworkSeries = series?.find((s) => s._id === artwork.seriesId);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link
        to="/"
        className="text-sm text-[var(--color-gallery-muted)] hover:text-[var(--color-gallery-text)] mb-8 inline-block"
      >
        &larr; Back
      </Link>

      <div className="grid lg:grid-cols-[1fr,300px] gap-12">
        <div
          className="cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
        >
          {artwork.imageUrl && (
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="w-full h-auto"
            />
          )}
        </div>

        <div className="space-y-6">
          <h1 className="font-[var(--font-serif)] text-3xl">{artwork.title}</h1>

          <dl className="space-y-3 text-sm">
            {artwork.year && (
              <div>
                <dt className="text-[var(--color-gallery-muted)]">Year</dt>
                <dd>{artwork.year}</dd>
              </div>
            )}
            {artwork.medium && (
              <div>
                <dt className="text-[var(--color-gallery-muted)]">Medium</dt>
                <dd>{artwork.medium}</dd>
              </div>
            )}
            {artwork.dimensions && (
              <div>
                <dt className="text-[var(--color-gallery-muted)]">Dimensions</dt>
                <dd>{artwork.dimensions}</dd>
              </div>
            )}
            {artworkSeries && (
              <div>
                <dt className="text-[var(--color-gallery-muted)]">Series</dt>
                <dd>
                  <Link
                    to={`/?series=${artworkSeries.slug}`}
                    className="underline underline-offset-2"
                  >
                    {artworkSeries.name}
                  </Link>
                </dd>
              </div>
            )}
          </dl>

          {artwork.description && (
            <p className="text-[var(--color-gallery-muted)] leading-relaxed">
              {artwork.description}
            </p>
          )}
        </div>
      </div>

      {artwork.imageUrl && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={[{ src: artwork.imageUrl, alt: artwork.title }]}
          styles={{
            container: { backgroundColor: "rgba(0, 0, 0, 0.95)" },
          }}
        />
      )}
    </div>
  );
}

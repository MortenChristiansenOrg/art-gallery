import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CollectionsGrid } from "../components/gallery";

export function Home() {
  const collections = useQuery(api.collections.listWithCounts);
  const ensureDefault = useMutation(api.init.ensureDefaultCollection);
  const initCalled = useRef(false);

  useEffect(() => {
    if (collections && collections.length === 0 && !initCalled.current) {
      initCalled.current = true;
      ensureDefault();
    }
  }, [collections, ensureDefault]);

  if (collections === undefined) {
    return (
      <div className="min-h-[80vh]">
        {/* Hero skeleton */}
        <div className="max-w-5xl mx-auto px-8 lg:px-12 pt-20 pb-16">
          <div className="max-w-2xl">
            <div className="h-10 w-64 skeleton-shimmer rounded" />
            <div className="h-5 w-96 skeleton-shimmer rounded mt-6" />
            <div className="h-5 w-80 skeleton-shimmer rounded mt-2" />
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="max-w-7xl mx-auto px-8 lg:px-12 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/2] skeleton-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasContent = collections.length > 0;

  return (
    <div className="min-h-[80vh]">
      {/* Hero / Introduction */}
      <section className="max-w-5xl mx-auto px-8 lg:px-12 pt-16 lg:pt-24 pb-16 lg:pb-20">
        <div className="max-w-2xl opacity-0 animate-fade-in">
          {/* Decorative line */}
          <div
            className="
              w-12 h-[1px] bg-[var(--color-gallery-border)]
              mb-8 origin-left
              opacity-0 animate-reveal-line stagger-1
            "
          />

          <h1
            className="
              font-[var(--font-serif)] text-[2.75rem] lg:text-[3.5rem]
              font-light tracking-[0.01em] leading-[1.1]
              text-[var(--color-gallery-text)]
            "
          >
            A curated space
            <br />
            <span className="italic text-[var(--color-gallery-muted)]">
              for visual art
            </span>
          </h1>

          <p
            className="
              mt-8 text-[1.05rem] lg:text-[1.1rem] leading-[1.7]
              font-light text-[var(--color-gallery-muted)]
              max-w-lg
            "
          >
            Step through the collections below to explore works organized by
            theme, medium, and inspiration. Each gallery offers a different
            perspective on the creative journey.
          </p>
        </div>
      </section>

      {/* Collections */}
      <section className="max-w-7xl mx-auto px-8 lg:px-12 pb-24">
        {/* Section label */}
        <div
          className="
            flex items-center gap-4 mb-10
            opacity-0 animate-fade-in stagger-2
          "
        >
          <span
            className="
              text-[0.7rem] tracking-[0.2em] uppercase
              text-[var(--color-gallery-subtle)]
              font-light
            "
          >
            Collections
          </span>
          <div className="flex-1 h-[1px] bg-[var(--color-gallery-border-light)]" />
        </div>

        {hasContent ? (
          <CollectionsGrid collections={collections} />
        ) : (
          <div
            className="
              flex flex-col items-center justify-center py-32
              opacity-0 animate-fade-in
            "
          >
            <p
              className="
                text-[var(--color-gallery-subtle)]
                text-[0.9rem] tracking-wide font-light
              "
            >
              No collections to display
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

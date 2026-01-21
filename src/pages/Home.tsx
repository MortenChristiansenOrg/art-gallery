import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CollectionsGrid } from "../components/gallery";

export function Home() {
  const collections = useQuery(api.collections.listWithCounts);
  const uncategorizedCount = useQuery(api.collections.getUncategorizedCount);

  if (collections === undefined || uncategorizedCount === undefined) {
    return (
      <div className="max-w-6xl mx-auto px-8 lg:px-12 py-16">
        {/* Loading skeleton */}
        <div className="space-y-8">
          {/* Header skeleton */}
          <div className="text-center mb-16">
            <div className="h-8 w-48 skeleton-shimmer rounded mx-auto" />
            <div className="h-4 w-64 skeleton-shimmer rounded mx-auto mt-4" />
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="
                  bg-[var(--color-gallery-surface)]
                  border border-[var(--color-gallery-border-light)]
                "
              >
                <div className="aspect-[4/3] skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasContent = collections.length > 0 || uncategorizedCount > 0;

  return (
    <section className="max-w-6xl mx-auto px-8 lg:px-12 py-16">
      {/* Page header */}
      <header className="text-center mb-16 opacity-0 animate-fade-in">
        <h1
          className="
            font-[var(--font-serif)] text-3xl lg:text-4xl
            font-light tracking-wide
            text-[var(--color-gallery-text)]
          "
        >
          Collections
        </h1>
        <p
          className="
            mt-4 text-[var(--color-gallery-muted)]
            text-[0.95rem] font-light tracking-wide
          "
        >
          Explore curated exhibitions
        </p>
      </header>

      {/* Collections grid */}
      {hasContent ? (
        <CollectionsGrid
          collections={collections}
          uncategorizedCount={uncategorizedCount}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-32 opacity-0 animate-fade-in">
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
  );
}

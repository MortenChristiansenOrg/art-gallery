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
  const hasImage = !!collection.coverImageUrl;

  return (
    <Link
      to={`/collection/${collection.slug}`}
      className="
        group block relative
        opacity-0 animate-fade-in
      "
      style={{ animationDelay: `${150 + index * 100}ms` }}
    >
      {/* Outer frame - creates gallery-like presentation */}
      <div
        className="
          relative overflow-hidden
          bg-[var(--color-gallery-surface)]
          transition-all duration-700 ease-out
          group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)]
        "
      >
        {/* Subtle corner accents */}
        <div className="absolute top-0 left-0 w-8 h-[1px] bg-[var(--color-gallery-border)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-0 left-0 w-[1px] h-8 bg-[var(--color-gallery-border)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-0 right-0 w-8 h-[1px] bg-[var(--color-gallery-border)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-0 right-0 w-[1px] h-8 bg-[var(--color-gallery-border)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 left-0 w-8 h-[1px] bg-[var(--color-gallery-border)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 left-0 w-[1px] h-8 bg-[var(--color-gallery-border)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-[var(--color-gallery-border)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 right-0 w-[1px] h-8 bg-[var(--color-gallery-border)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Main visual area */}
        <div className="relative aspect-[3/2] overflow-hidden">
          {hasImage ? (
            <>
              {/* Cover image with zoom effect */}
              <img
                src={collection.coverImageUrl!}
                alt={collection.name}
                className="
                  w-full h-full object-cover
                  transition-transform duration-1000 ease-out
                  group-hover:scale-110
                "
              />

              {/* Gradient overlay - darker for better text contrast */}
              <div
                className="
                  absolute inset-0
                  bg-gradient-to-t from-black/80 via-black/30 to-black/5
                  transition-opacity duration-500
                "
              />

              {/* Vignette effect */}
              <div
                className="
                  absolute inset-0
                  shadow-[inset_0_0_100px_rgba(0,0,0,0.3)]
                  transition-opacity duration-500
                  opacity-0 group-hover:opacity-100
                "
              />
            </>
          ) : (
            /* No-image elegant fallback */
            <NoImageFallback name={collection.name} />
          )}

          {/* Content overlay */}
          <div
            className="
              absolute inset-0 flex flex-col justify-end
              p-6 lg:p-8
            "
          >
            {/* Collection name */}
            <h2
              className={`
                font-[var(--font-serif)] text-[1.75rem] lg:text-[2rem]
                font-light tracking-[0.02em] leading-tight
                transition-transform duration-500
                group-hover:-translate-y-1
                ${hasImage ? "text-white" : "text-[var(--color-gallery-text)]"}
              `}
            >
              {collection.name}
            </h2>

            {/* Description */}
            {collection.description && (
              <p
                className={`
                  mt-3 text-[0.9rem] font-light leading-relaxed
                  line-clamp-2
                  transition-all duration-500
                  ${hasImage
                    ? "text-white/70 group-hover:text-white/90"
                    : "text-[var(--color-gallery-muted)]"
                  }
                `}
              >
                {collection.description}
              </p>
            )}

            {/* Metadata line */}
            <div
              className={`
                mt-4 flex items-center gap-4
                text-[0.7rem] tracking-[0.15em] uppercase font-light
                ${hasImage ? "text-white/50" : "text-[var(--color-gallery-subtle)]"}
              `}
            >
              <span>{collection.artworkCount} {collection.artworkCount === 1 ? "work" : "works"}</span>
              <span className="flex items-center gap-2 transition-transform duration-300 group-hover:translate-x-1">
                <span>Enter</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* Elegant fallback for collections without cover images */
function NoImageFallback({ name }: { name: string }) {
  // Generate a subtle, deterministic pattern based on collection name
  const seed = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = seed % 30; // Subtle warm hue variation (0-30)
  const patterns = [
    // Diagonal lines
    `repeating-linear-gradient(
      ${45 + (seed % 30)}deg,
      transparent,
      transparent 20px,
      rgba(0,0,0,0.02) 20px,
      rgba(0,0,0,0.02) 21px
    )`,
    // Subtle grid
    `linear-gradient(rgba(0,0,0,0.015) 1px, transparent 1px),
     linear-gradient(90deg, rgba(0,0,0,0.015) 1px, transparent 1px)`,
    // Radial subtle
    `radial-gradient(circle at ${30 + (seed % 40)}% ${30 + (seed % 40)}%,
      rgba(0,0,0,0.03) 0%,
      transparent 50%)`,
  ];
  const patternIndex = seed % patterns.length;

  return (
    <div
      className="
        w-full h-full
        bg-gradient-to-br from-[var(--color-gallery-hover)] to-[var(--color-gallery-bg)]
        flex items-center justify-center
        transition-all duration-700
        group-hover:from-[var(--color-gallery-bg)] group-hover:to-[var(--color-gallery-hover)]
      "
      style={{
        backgroundImage: patterns[patternIndex],
        backgroundSize: patternIndex === 1 ? "30px 30px" : undefined,
      }}
    >
      {/* Large decorative initial */}
      <span
        className="
          font-[var(--font-serif)] text-[8rem] lg:text-[10rem]
          font-light text-[var(--color-gallery-border)]
          select-none
          transition-all duration-700
          group-hover:text-[var(--color-gallery-border-light)]
          group-hover:scale-105
        "
        style={{ color: `hsl(${hue}, 5%, 90%)` }}
      >
        {name.charAt(0)}
      </span>
    </div>
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
        group block relative
        opacity-0 animate-fade-in
      "
      style={{ animationDelay: `${150 + index * 100}ms` }}
    >
      {/* Outer frame */}
      <div
        className="
          relative overflow-hidden
          bg-[var(--color-gallery-text)]
          transition-all duration-700 ease-out
          group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)]
        "
      >
        {/* Corner accents - inverted colors for dark bg */}
        <div className="absolute top-0 left-0 w-8 h-[1px] bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-0 left-0 w-[1px] h-8 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-0 right-0 w-8 h-[1px] bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-0 right-0 w-[1px] h-8 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 left-0 w-8 h-[1px] bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 left-0 w-[1px] h-8 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 right-0 w-[1px] h-8 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative aspect-[3/2] overflow-hidden">
          {/* Abstract pattern background */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="cabinet-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1" fill="currentColor" className="text-white" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#cabinet-pattern)" />
            </svg>
          </div>

          {/* Centered icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="
                w-20 h-20 lg:w-24 lg:h-24
                border border-white/10
                flex items-center justify-center
                transition-all duration-700
                group-hover:border-white/20 group-hover:scale-105
              "
            >
              <svg
                className="w-8 h-8 lg:w-10 lg:h-10 text-white/30 transition-colors duration-500 group-hover:text-white/50"
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
          </div>

          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
            <h2
              className="
                font-[var(--font-serif)] text-[1.75rem] lg:text-[2rem]
                font-light tracking-[0.02em] leading-tight
                text-white italic
                transition-transform duration-500
                group-hover:-translate-y-1
              "
            >
              Cabinet of Curiosities
            </h2>

            <p
              className="
                mt-3 text-[0.9rem] font-light
                text-white/60 group-hover:text-white/80
                transition-colors duration-500
              "
            >
              Uncategorized works and experiments
            </p>

            <div
              className="
                mt-4 flex items-center gap-4
                text-[0.7rem] tracking-[0.15em] uppercase font-light text-white/40
              "
            >
              <span>{count} {count === 1 ? "work" : "works"}</span>
              <span className="flex items-center gap-2 transition-transform duration-300 group-hover:translate-x-1">
                <span>Enter</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

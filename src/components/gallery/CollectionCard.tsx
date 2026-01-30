import { Link } from "react-router-dom";
import type { Id } from "../../../convex/_generated/dataModel";

interface CollectionCardProps {
  collection: {
    _id: Id<"collections">;
    name: string;
    description?: string;
    slug: string;
    coverImageUrl: string | null;
    iconSvg?: string;
    artworkCount: number;
  };
  index: number;
}

export function CollectionCard({ collection, index }: CollectionCardProps) {
  const hasImage = !!collection.coverImageUrl;

  return (
    <Link
      to={`/collection/${collection.slug}`}
      data-testid="collection-card"
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
            <NoImageFallback name={collection.name} iconSvg={collection.iconSvg} />
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
function NoImageFallback({ name, iconSvg }: { name: string; iconSvg?: string }) {
  // Game-icons SVGs have path 1 (bounding box) + path 2+ (actual icon).
  // If only 1 path exists, it's just the empty frame — treat as no icon.
  const hasRealIcon = iconSvg
    ? (iconSvg.match(/<path[\s/]/g)?.length ?? 0) > 1
    : false;

  // Generate a subtle, deterministic pattern based on collection name
  const seed = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = (seed % 40) + 15; // Warm hue range (15-55: gold to amber)
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
        pb-[20%]
        transition-all duration-700
        group-hover:from-[var(--color-gallery-bg)] group-hover:to-[var(--color-gallery-hover)]
      "
      style={{
        backgroundImage: patterns[patternIndex],
        backgroundSize: patternIndex === 1 ? "30px 30px" : undefined,
      }}
    >
      {hasRealIcon ? (
        <div
          className="
            w-[6rem] h-[6rem] lg:w-[7rem] lg:h-[7rem]
            select-none
            transition-all duration-700
            opacity-40 group-hover:opacity-55
            group-hover:scale-105
            [&_svg]:w-full [&_svg]:h-full
            [&_svg>path:first-child]:fill-none
            [&_svg>path:not(:first-child)]:fill-current
          "
          style={{ color: `hsl(${hue}, 12%, 45%)` }}
          dangerouslySetInnerHTML={{ __html: iconSvg! }}
        />
      ) : (
        <span
          className="
            font-[var(--font-serif)] text-[5rem] lg:text-[6rem]
            font-light
            select-none
            transition-all duration-700
            group-hover:scale-105
          "
          style={{ color: `hsl(${hue}, 10%, 72%)` }}
        >
          {name.charAt(0)}
        </span>
      )}
    </div>
  );
}


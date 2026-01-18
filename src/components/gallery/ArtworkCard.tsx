import { Link } from "react-router-dom";
import type { Id } from "../../convex/_generated/dataModel";

interface ArtworkCardProps {
  id: Id<"artworks">;
  title: string;
  imageUrl: string | null;
  year?: number;
  onClick?: () => void;
  index?: number;
}

export function ArtworkCard({ id, title, imageUrl, year, onClick, index = 0 }: ArtworkCardProps) {
  // Stagger class based on index (1-9 cycle)
  const staggerClass = `stagger-${(index % 9) + 1}`;

  const content = (
    <article
      className={`
        group cursor-pointer opacity-0 animate-fade-in ${staggerClass}
      `}
    >
      {/* Frame container */}
      <div
        className="
          relative bg-[var(--color-gallery-surface)]
          border border-[var(--color-gallery-border)]
          p-3 sm:p-4
          gallery-frame
        "
      >
        {/* Inner matting effect */}
        <div className="relative overflow-hidden bg-[var(--color-gallery-hover)]">
          {/* Aspect ratio container */}
          <div className="aspect-[4/5]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="
                  w-full h-full object-cover
                  transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
                  group-hover:scale-[1.03]
                "
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-[var(--color-gallery-subtle)] text-sm tracking-wide">
                  No image
                </span>
              </div>
            )}
          </div>

          {/* Subtle overlay on hover */}
          <div
            className="
              absolute inset-0 bg-[var(--color-gallery-text)]
              opacity-0 group-hover:opacity-[0.02]
              transition-opacity duration-500
              pointer-events-none
            "
          />
        </div>
      </div>

      {/* Caption below frame */}
      <div className="mt-5 px-1">
        <h3
          className="
            font-[var(--font-serif)] text-[1.1rem] font-normal
            tracking-[0.01em] leading-snug
            text-[var(--color-gallery-text)]
            group-hover:text-[var(--color-gallery-muted)]
            transition-colors duration-300
          "
        >
          {title}
        </h3>
        {year && (
          <p
            className="
              mt-1.5 text-[0.75rem] tracking-[0.08em]
              text-[var(--color-gallery-subtle)]
              font-light
            "
          >
            {year}
          </p>
        )}
      </div>
    </article>
  );

  if (onClick) {
    return (
      <div onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
        {content}
      </div>
    );
  }

  return <Link to={`/artwork/${id}`}>{content}</Link>;
}

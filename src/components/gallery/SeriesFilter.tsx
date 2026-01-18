import { Link, useSearchParams } from "react-router-dom";
import type { Id } from "../../convex/_generated/dataModel";

interface Series {
  _id: Id<"series">;
  name: string;
  slug: string;
}

interface SeriesFilterProps {
  series: Series[];
}

export function SeriesFilter({ series }: SeriesFilterProps) {
  const [searchParams] = useSearchParams();
  const currentSeries = searchParams.get("series");

  return (
    <nav
      className="
        mb-16 pb-8
        border-b border-[var(--color-gallery-border-light)]
        opacity-0 animate-fade-in
      "
      aria-label="Filter artworks by series"
    >
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        {/* Label */}
        <span
          className="
            text-[0.7rem] tracking-[0.2em] uppercase
            text-[var(--color-gallery-subtle)]
            font-light
            hidden sm:block
          "
        >
          Filter
        </span>

        {/* Divider */}
        <span
          className="
            hidden sm:block
            w-[1px] h-4
            bg-[var(--color-gallery-border)]
          "
        />

        {/* Filter links */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            to="/"
            className={`
              relative text-[0.8rem] tracking-[0.1em] uppercase font-light
              transition-colors duration-300
              ${!currentSeries
                ? "text-[var(--color-gallery-text)]"
                : "text-[var(--color-gallery-muted)] hover:text-[var(--color-gallery-text)]"
              }
            `}
          >
            All Works
            <span
              className={`
                absolute -bottom-1 left-0 w-full h-[1px]
                bg-[var(--color-gallery-text)]
                transition-transform duration-300 origin-left
                ${!currentSeries ? "scale-x-100" : "scale-x-0"}
              `}
            />
          </Link>

          {series.map((s) => {
            const isActive = currentSeries === s.slug;
            return (
              <Link
                key={s._id}
                to={`/?series=${s.slug}`}
                className={`
                  relative text-[0.8rem] tracking-[0.1em] uppercase font-light
                  transition-colors duration-300
                  ${isActive
                    ? "text-[var(--color-gallery-text)]"
                    : "text-[var(--color-gallery-muted)] hover:text-[var(--color-gallery-text)]"
                  }
                `}
              >
                {s.name}
                <span
                  className={`
                    absolute -bottom-1 left-0 w-full h-[1px]
                    bg-[var(--color-gallery-text)]
                    transition-transform duration-300 origin-left
                    ${isActive ? "scale-x-100" : "scale-x-0"}
                  `}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

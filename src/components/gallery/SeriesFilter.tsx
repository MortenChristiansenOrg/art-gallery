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
    <div className="flex flex-wrap gap-4 mb-12">
      <Link
        to="/"
        className={`text-sm uppercase tracking-wide transition-opacity hover:opacity-100 ${
          !currentSeries ? "opacity-100 underline underline-offset-4" : "opacity-60"
        }`}
      >
        All
      </Link>
      {series.map((s) => (
        <Link
          key={s._id}
          to={`/?series=${s.slug}`}
          className={`text-sm uppercase tracking-wide transition-opacity hover:opacity-100 ${
            currentSeries === s.slug
              ? "opacity-100 underline underline-offset-4"
              : "opacity-60"
          }`}
        >
          {s.name}
        </Link>
      ))}
    </div>
  );
}

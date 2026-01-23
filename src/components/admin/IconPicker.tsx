import { useState, useEffect, useRef, useCallback } from "react";

interface IconPickerProps {
  value: string | null;
  onChange: (svg: string | null) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [iconList, setIconList] = useState<string[]>([]);
  const [fetchingSvg, setFetchingSvg] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch icon list once
  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/ArnoldSmith86/gameicons-metadata/master/list.txt"
    )
      .then((r) => r.text())
      .then((text) => {
        setIconList(text.trim().split("\n"));
      })
      .catch(console.error);
  }, []);

  // Debounce search
  const handleSearch = useCallback((val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(val), 300);
  }, []);

  const filtered = debouncedQuery.length >= 2
    ? iconList.filter((path) => {
        const name = path.split("/").pop() || "";
        return name.includes(debouncedQuery.toLowerCase());
      }).slice(0, 60)
    : [];

  const handleSelect = async (path: string) => {
    setFetchingSvg(path);
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/game-icons/icons/master/${path}.svg`
      );
      if (!res.ok) throw new Error(`Failed to fetch SVG: ${res.status}`);
      const svg = await res.text();
      onChange(svg);
    } catch (err) {
      console.error("Failed to fetch icon SVG:", err);
    } finally {
      setFetchingSvg(null);
    }
  };

  if (value) {
    return (
      <div className="space-y-2">
        <label className="block text-xs text-[var(--color-gallery-muted)]">
          Selected icon
        </label>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 flex items-center justify-center [&_svg]:w-10 [&_svg]:h-10 [&_svg>path:first-child]:fill-none [&_svg>path:not(:first-child)]:fill-[var(--color-gallery-muted)]"
            dangerouslySetInnerHTML={{ __html: value }}
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="px-2 py-1 text-xs border border-[var(--color-gallery-border)] hover:bg-[var(--color-gallery-hover)]"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs text-[var(--color-gallery-muted)]">
        Or pick an icon (game-icons.net)
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search icons..."
        className="w-full px-3 py-2 border border-[var(--color-gallery-border)] bg-transparent text-sm"
      />
      {debouncedQuery.length >= 2 && (
        <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto p-1 border border-[var(--color-gallery-border)]">
          {filtered.length === 0 && (
            <span className="col-span-8 text-xs text-[var(--color-gallery-muted)] text-center py-2">
              No icons found
            </span>
          )}
          {filtered.map((path) => (
            <button
              key={path}
              type="button"
              onClick={() => handleSelect(path)}
              disabled={fetchingSvg === path}
              className="w-full aspect-square flex items-center justify-center hover:bg-[var(--color-gallery-hover)] rounded transition-colors"
              title={path.split("/").pop()}
            >
              <img
                src={`https://game-icons.net/icons/000000/transparent/1x1/${path}.svg`}
                alt={path.split("/").pop()}
                className="w-6 h-6"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

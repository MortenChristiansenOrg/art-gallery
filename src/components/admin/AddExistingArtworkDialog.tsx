import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAuth } from "../../lib/auth";

interface AddExistingArtworkDialogProps {
  collectionId: Id<"collections">;
  onClose: () => void;
}

export function AddExistingArtworkDialog({
  collectionId,
  onClose,
}: AddExistingArtworkDialogProps) {
  const { token } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const addToCollection = useMutation(api.artworks.addToCollection);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useQuery(
    api.artworks.searchByTitle,
    debouncedQuery.trim()
      ? { query: debouncedQuery, collectionId }
      : "skip"
  );

  const handleAdd = async (artworkId: Id<"artworks">) => {
    if (!token) return;
    await addToCollection({ token, artworkId, collectionId });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--color-gallery-bg)] p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h2 className="font-[var(--font-serif)] text-xl mb-4">
          Add Existing Artwork
        </h2>

        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by title..."
          className="w-full px-3 py-2 border border-[var(--color-gallery-border)] bg-transparent text-sm mb-4"
          data-testid="search-existing-input"
        />

        <div className="space-y-1 min-h-[100px]" data-testid="search-results">
          {!debouncedQuery.trim() && (
            <p className="text-sm text-[var(--color-gallery-muted)] text-center py-8">
              Type to search artworks
            </p>
          )}
          {debouncedQuery.trim() && results?.length === 0 && (
            <p className="text-sm text-[var(--color-gallery-muted)] text-center py-8">
              No artworks found
            </p>
          )}
          {results?.map((artwork) => (
            <button
              key={artwork._id}
              onClick={() => !artwork.alreadyInCollection && handleAdd(artwork._id)}
              disabled={artwork.alreadyInCollection}
              className={`flex items-center gap-3 w-full p-2 text-left border border-[var(--color-gallery-border)] transition-colors ${
                artwork.alreadyInCollection
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[var(--color-gallery-text)]/5 cursor-pointer"
              }`}
              data-testid={`search-result-${artwork._id}`}
            >
              {artwork.thumbnailUrl ? (
                <img
                  src={artwork.thumbnailUrl}
                  alt={artwork.title}
                  className="w-10 h-10 object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-[var(--color-gallery-border)]" />
              )}
              <span className="flex-1 text-sm">{artwork.title}</span>
              {artwork.alreadyInCollection && (
                <span className="text-xs text-[var(--color-gallery-muted)]">
                  Already added
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 border border-[var(--color-gallery-border)] text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

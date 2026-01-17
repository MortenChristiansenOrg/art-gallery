import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface ArtworkFormProps {
  artwork?: {
    _id: Id<"artworks">;
    title: string;
    description?: string;
    seriesId?: Id<"series">;
    year?: number;
    medium?: string;
    dimensions?: string;
    published: boolean;
  };
  onClose: () => void;
}

export function ArtworkForm({ artwork, onClose }: ArtworkFormProps) {
  const series = useQuery(api.series.list);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createArtwork = useMutation(api.artworks.create);
  const updateArtwork = useMutation(api.artworks.update);

  const [form, setForm] = useState({
    title: artwork?.title ?? "",
    description: artwork?.description ?? "",
    seriesId: artwork?.seriesId ?? "",
    year: artwork?.year?.toString() ?? "",
    medium: artwork?.medium ?? "",
    dimensions: artwork?.dimensions ?? "",
    published: artwork?.published ?? false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    if (!artwork && !file) return;

    setLoading(true);
    try {
      let imageId: Id<"_storage"> | undefined;

      if (file) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();
        imageId = storageId;
      }

      const data = {
        title: form.title,
        description: form.description || undefined,
        seriesId: form.seriesId ? (form.seriesId as Id<"series">) : undefined,
        year: form.year ? parseInt(form.year) : undefined,
        medium: form.medium || undefined,
        dimensions: form.dimensions || undefined,
        published: form.published,
      };

      if (artwork) {
        await updateArtwork({
          id: artwork._id,
          ...data,
          ...(imageId && { imageId }),
        });
      } else {
        await createArtwork({
          ...data,
          imageId: imageId!,
        });
      }

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--color-gallery-bg)] p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="font-[var(--font-serif)] text-xl mb-6">
          {artwork ? "Edit Artwork" : "Add Artwork"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full px-3 py-2 border border-[var(--color-gallery-border)] bg-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Image {!artwork && "*"}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required={!artwork}
              className="w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Series</label>
            <select
              value={form.seriesId}
              onChange={(e) => setForm({ ...form, seriesId: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-gallery-border)] bg-transparent text-sm"
            >
              <option value="">None</option>
              {series?.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Year</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-gallery-border)] bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Dimensions</label>
              <input
                type="text"
                value={form.dimensions}
                onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                placeholder="e.g., 24 x 36 in"
                className="w-full px-3 py-2 border border-[var(--color-gallery-border)] bg-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Medium</label>
            <input
              type="text"
              value={form.medium}
              onChange={(e) => setForm({ ...form, medium: e.target.value })}
              placeholder="e.g., Oil on canvas"
              className="w-full px-3 py-2 border border-[var(--color-gallery-border)] bg-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--color-gallery-border)] bg-transparent text-sm resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            <label htmlFor="published" className="text-sm">
              Published
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[var(--color-gallery-border)] text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[var(--color-gallery-text)] text-[var(--color-gallery-bg)] text-sm disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

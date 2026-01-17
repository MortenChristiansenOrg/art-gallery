import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface SeriesFormProps {
  series?: {
    _id: Id<"series">;
    name: string;
    description?: string;
    slug: string;
  };
  onClose: () => void;
}

export function SeriesForm({ series, onClose }: SeriesFormProps) {
  const createSeries = useMutation(api.series.create);
  const updateSeries = useMutation(api.series.update);

  const [form, setForm] = useState({
    name: series?.name ?? "",
    description: series?.description ?? "",
    slug: series?.slug ?? "",
  });
  const [loading, setLoading] = useState(false);

  const handleNameChange = (name: string) => {
    setForm({
      ...form,
      name,
      slug: series ? form.slug : name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) return;

    setLoading(true);
    try {
      if (series) {
        await updateSeries({
          id: series._id,
          name: form.name,
          description: form.description || undefined,
          slug: form.slug,
        });
      } else {
        await createSeries({
          name: form.name,
          description: form.description || undefined,
          slug: form.slug,
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
      <div className="bg-[var(--color-gallery-bg)] p-6 rounded-lg max-w-md w-full">
        <h2 className="font-[var(--font-serif)] text-xl mb-6">
          {series ? "Edit Series" : "Add Series"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[var(--color-gallery-border)] bg-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Slug *</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
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

import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAuth } from "../../lib/auth";
import { ImageCropper } from "./ImageCropper";

interface CollectionFormProps {
  collection?: {
    _id: Id<"collections">;
    name: string;
    description?: string;
    slug: string;
    coverImageUrl?: string | null;
  };
  onClose: () => void;
}

type CoverSource = "none" | "artwork" | "upload";

export function CollectionForm({ collection, onClose }: CollectionFormProps) {
  const { token } = useAuth();
  const createCollection = useMutation(api.collections.create);
  const updateCollection = useMutation(api.collections.update);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  // Get artworks for this collection if editing
  const artworks = useQuery(
    api.artworks.list,
    collection ? { collectionId: collection._id } : "skip"
  );

  const [form, setForm] = useState({
    name: collection?.name ?? "",
    description: collection?.description ?? "",
    slug: collection?.slug ?? "",
  });

  const [coverSource, setCoverSource] = useState<CoverSource>(
    collection?.coverImageUrl ? "artwork" : "none"
  );
  const [selectedArtworkUrl, setSelectedArtworkUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (name: string) => {
    setForm({
      ...form,
      name,
      slug: collection
        ? form.slug
        : name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    });
  };

  const handleArtworkSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const artworkId = e.target.value;
    if (!artworkId) {
      setCoverSource("none");
      setSelectedArtworkUrl(null);
      return;
    }

    const artwork = artworks?.find((a) => a._id === artworkId);
    if (artwork?.thumbnailUrl) {
      setCoverSource("artwork");
      setSelectedArtworkUrl(artwork.thumbnailUrl);
      setShowCropper(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setCoverSource("upload");
    setUploadedImageUrl(url);
    setShowCropper(true);
    e.target.value = "";
  };

  const handleCrop = (blob: Blob) => {
    setCroppedBlob(blob);
    const preview = URL.createObjectURL(blob);
    setCroppedPreview(preview);
    setShowCropper(false);
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    if (coverSource === "upload" && uploadedImageUrl) {
      URL.revokeObjectURL(uploadedImageUrl);
      setUploadedImageUrl(null);
    }
    setSelectedArtworkUrl(null);
    setCoverSource("none");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug || !token) return;

    setLoading(true);
    try {
      let coverImageId: Id<"_storage"> | undefined;

      // Upload cropped cover if we have one
      if (croppedBlob) {
        const uploadUrl = await generateUploadUrl({ token });
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "image/jpeg" },
          body: croppedBlob,
        });
        const { storageId } = await result.json();
        coverImageId = storageId;
      }

      if (collection) {
        await updateCollection({
          token,
          id: collection._id,
          name: form.name,
          description: form.description || undefined,
          slug: form.slug,
          ...(coverImageId && { coverImageId }),
        });
      } else {
        await createCollection({
          token,
          name: form.name,
          description: form.description || undefined,
          slug: form.slug,
          ...(coverImageId && { coverImageId }),
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const imageUrlForCropper = coverSource === "artwork" ? selectedArtworkUrl : uploadedImageUrl;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-[var(--color-gallery-bg)] p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <h2 className="font-[var(--font-serif)] text-xl mb-6">
            {collection ? "Edit Collection" : "Add Collection"}
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

            {/* Cover Image Section */}
            <div className="space-y-3">
              <label className="block text-sm mb-1">Cover Image</label>

              {/* Current/cropped preview */}
              {(croppedPreview || collection?.coverImageUrl) && (
                <div className="relative">
                  <img
                    src={croppedPreview || collection?.coverImageUrl || ""}
                    alt="Cover preview"
                    className="w-full h-32 object-cover rounded border border-[var(--color-gallery-border)]"
                  />
                  {croppedPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setCroppedBlob(null);
                        if (croppedPreview) URL.revokeObjectURL(croppedPreview);
                        setCroppedPreview(null);
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-xs rounded"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}

              {/* Select from artworks */}
              {artworks && artworks.length > 0 && !croppedPreview && (
                <div>
                  <label className="block text-xs text-[var(--color-gallery-muted)] mb-1">
                    Select from collection artworks
                  </label>
                  <select
                    onChange={handleArtworkSelect}
                    className="w-full px-3 py-2 border border-[var(--color-gallery-border)] bg-transparent text-sm"
                    defaultValue=""
                  >
                    <option value="">Choose artwork...</option>
                    {artworks.map((artwork) => (
                      <option key={artwork._id} value={artwork._id}>
                        {artwork.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Upload option */}
              {!croppedPreview && (
                <div>
                  <label className="block text-xs text-[var(--color-gallery-muted)] mb-1">
                    Or upload a custom image
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 border border-dashed border-[var(--color-gallery-border)] text-sm w-full hover:border-[var(--color-gallery-text)]/50"
                  >
                    Upload Image
                  </button>
                </div>
              )}
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

      {/* Cropper modal */}
      {showCropper && imageUrlForCropper && (
        <ImageCropper
          imageUrl={imageUrlForCropper}
          onCrop={handleCrop}
          onCancel={handleCancelCrop}
          aspectRatio={4 / 3}
        />
      )}
    </>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const MAX_IMAGES = 50;
const THUMBNAIL_SIZE = 80;

interface SelectedImage {
  file: File;
  title: string;
  thumbnailUrl: string;
}

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

function generateThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(THUMBNAIL_SIZE / img.width, THUMBNAIL_SIZE / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("");
    };
    img.src = url;
  });
}

function getFilenameWithoutExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

export function ArtworkForm({ artwork, onClose }: ArtworkFormProps) {
  const series = useQuery(api.series.list);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createArtwork = useMutation(api.artworks.create);
  const updateArtwork = useMutation(api.artworks.update);

  const [form, setForm] = useState({
    description: artwork?.description ?? "",
    seriesId: artwork?.seriesId ?? "",
    year: artwork?.year?.toString() ?? "",
    medium: artwork?.medium ?? "",
    dimensions: artwork?.dimensions ?? "",
    published: artwork?.published ?? false,
  });

  // Edit mode: single title
  const [editTitle, setEditTitle] = useState(artwork?.title ?? "");

  // Create mode: bulk images
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      selectedImages.forEach(img => {
        if (img.thumbnailUrl.startsWith("blob:")) {
          URL.revokeObjectURL(img.thumbnailUrl);
        }
      });
    };
  }, []);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith("image/"));
    const remaining = MAX_IMAGES - selectedImages.length;
    const filesToAdd = fileArray.slice(0, remaining);

    if (fileArray.length > remaining) {
      alert(`Maximum ${MAX_IMAGES} images allowed. Only adding first ${remaining}.`);
    }

    const newImages: SelectedImage[] = await Promise.all(
      filesToAdd.map(async (file) => ({
        file,
        title: getFilenameWithoutExtension(file.name),
        thumbnailUrl: await generateThumbnail(file),
      }))
    );

    setSelectedImages(prev => [...prev, ...newImages]);
  }, [selectedImages.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
    }
    // Reset input so same files can be selected again
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => {
      const img = prev[index];
      if (img.thumbnailUrl.startsWith("blob:")) {
        URL.revokeObjectURL(img.thumbnailUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateImageTitle = (index: number, title: string) => {
    setSelectedImages(prev => prev.map((img, i) =>
      i === index ? { ...img, title } : img
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Edit mode validation
    if (artwork && !editTitle) return;

    // Create mode validation
    if (!artwork && selectedImages.length === 0) return;
    if (!artwork && selectedImages.some(img => !img.title.trim())) {
      alert("All images must have a title");
      return;
    }

    setLoading(true);
    setUploadErrors([]);

    try {
      if (artwork) {
        // Edit mode - pass actual values so fields can be cleared
        let imageId: Id<"_storage"> | undefined;

        if (selectedImages.length > 0) {
          const file = selectedImages[0].file;
          const uploadUrl = await generateUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });
          const { storageId } = await result.json();
          imageId = storageId;
        }

        await updateArtwork({
          id: artwork._id,
          title: editTitle,
          description: form.description,
          seriesId: form.seriesId ? (form.seriesId as Id<"series">) : undefined,
          year: form.year ? parseInt(form.year) : undefined,
          medium: form.medium,
          dimensions: form.dimensions,
          published: form.published,
          ...(imageId && { imageId }),
        });
      } else {
        // Create mode - bulk upload (use undefined for optional empty fields)
        const sharedData = {
          description: form.description || undefined,
          seriesId: form.seriesId ? (form.seriesId as Id<"series">) : undefined,
          year: form.year ? parseInt(form.year) : undefined,
          medium: form.medium || undefined,
          dimensions: form.dimensions || undefined,
          published: form.published,
        };

        const total = selectedImages.length;
        const errors: string[] = [];

        for (let i = 0; i < total; i++) {
          const { file, title } = selectedImages[i];
          setUploadProgress({ current: i + 1, total });

          try {
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": file.type },
              body: file,
            });

            if (!result.ok) {
              throw new Error(`Upload failed: ${result.statusText}`);
            }

            const { storageId } = await result.json();

            await createArtwork({
              title: title.trim(),
              imageId: storageId,
              ...sharedData,
            });
          } catch (err) {
            errors.push(`${title}: ${err instanceof Error ? err.message : "Unknown error"}`);
          }
        }

        if (errors.length > 0) {
          setUploadErrors(errors);
          setUploadProgress(null);
          setLoading(false);
          return;
        }
      }

      onClose();
    } catch (err) {
      console.error(err);
      setUploadErrors([err instanceof Error ? err.message : "Unknown error"]);
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const isEditMode = !!artwork;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--color-gallery-bg)] p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h2 className="font-[var(--font-serif)] text-xl mb-6">
          {artwork ? "Edit Artwork" : "Add Artwork"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Selection - different for edit vs create */}
          <div>
            <label className="block text-sm mb-1">
              {isEditMode ? "Replace Image" : `Images${selectedImages.length === 0 ? " *" : ""}`}
            </label>

            {/* Drop zone */}
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded p-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-[var(--color-gallery-text)] bg-[var(--color-gallery-text)]/5"
                  : "border-[var(--color-gallery-border)] hover:border-[var(--color-gallery-text)]/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={!isEditMode}
                onChange={handleFileChange}
                className="hidden"
                data-testid="file-input"
              />
              <p className="text-sm text-[var(--color-gallery-muted)]">
                {isDragging
                  ? "Drop images here"
                  : isEditMode
                    ? "Click or drag to replace image"
                    : `Click or drag images here (max ${MAX_IMAGES})`
                }
              </p>
            </div>

            {/* Selected images list */}
            {selectedImages.length > 0 && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {selectedImages.map((img, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 border border-[var(--color-gallery-border)] rounded"
                    data-testid={`image-row-${index}`}
                  >
                    <img
                      src={img.thumbnailUrl}
                      alt=""
                      className="w-10 h-10 object-cover rounded"
                    />
                    {!isEditMode && (
                      <input
                        type="text"
                        value={img.title}
                        onChange={(e) => updateImageTitle(index, e.target.value)}
                        placeholder="Title"
                        required
                        className="flex-1 px-2 py-1 border border-[var(--color-gallery-border)] bg-transparent text-sm"
                        data-testid={`title-input-${index}`}
                      />
                    )}
                    {isEditMode && (
                      <span className="flex-1 text-sm truncate">{img.file.name}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="text-red-600 hover:text-red-700 text-sm px-2"
                      data-testid={`remove-image-${index}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Title field - only for edit mode */}
          {isEditMode && (
            <div>
              <label className="block text-sm mb-1">Title *</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[var(--color-gallery-border)] bg-transparent text-sm"
              />
            </div>
          )}

          {/* Shared metadata fields */}
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
              data-testid="published-toggle"
            />
            <label htmlFor="published" className="text-sm">
              Published
            </label>
          </div>

          {/* Upload progress */}
          {uploadProgress && (
            <div className="text-sm text-[var(--color-gallery-muted)]" data-testid="upload-progress">
              Uploading {uploadProgress.current} of {uploadProgress.total}...
            </div>
          )}

          {/* Upload errors */}
          {uploadErrors.length > 0 && (
            <div className="text-sm text-red-600 space-y-1" data-testid="upload-errors">
              <p className="font-medium">Some uploads failed:</p>
              {uploadErrors.map((err, i) => (
                <p key={i}>• {err}</p>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-[var(--color-gallery-border)] text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!artwork && selectedImages.length === 0)}
              className="flex-1 px-4 py-2 bg-[var(--color-gallery-text)] text-[var(--color-gallery-bg)] text-sm disabled:opacity-50"
              data-testid="submit-button"
            >
              {loading
                ? uploadProgress
                  ? `Uploading ${uploadProgress.current}/${uploadProgress.total}`
                  : "Saving..."
                : "Save"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

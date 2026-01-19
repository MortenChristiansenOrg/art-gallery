import { useState, useRef, useEffect } from "react";

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  aspectRatio?: string;
  loading?: "lazy" | "eager";
  sizes?: string;
  onLoad?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className = "",
  placeholderClassName = "",
  aspectRatio = "4/5",
  loading = "lazy",
  onLoad,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
      onLoad?.();
    }
  }, [src, onLoad]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
  };

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--color-gallery-hover)] ${placeholderClassName}`}
        style={{ aspectRatio }}
      >
        <span className="text-[var(--color-gallery-subtle)] text-sm tracking-wide">
          {hasError ? "Failed to load" : "No image"}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" style={{ aspectRatio }}>
      {/* Blur placeholder */}
      {!isLoaded && (
        <div
          className={`absolute inset-0 skeleton-shimmer ${placeholderClassName}`}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`
          w-full h-full object-cover
          transition-opacity duration-300
          ${isLoaded ? "opacity-100" : "opacity-0"}
          ${className}
        `}
      />
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from "react";
import OpenSeadragon from "openseadragon";

interface ImageViewerProps {
  imageUrl: string;
  dziUrl?: string | null;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageViewer({ imageUrl, dziUrl, title, isOpen, onClose }: ImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<OpenSeadragon.Viewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Initialize OpenSeadragon
  useEffect(() => {
    if (!isOpen || !containerRef.current || !imageUrl) return;

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    setIsLoading(true);

    // Use DZI tiles if available, otherwise fall back to single image
    // For cloud: transform .cloud to .site
    // For local: use port 3211 for HTTP routes
    const convexUrl = import.meta.env.VITE_CONVEX_URL;
    let convexSiteUrl: string | undefined;
    if (convexUrl?.includes(".cloud")) {
      convexSiteUrl = convexUrl.replace(".cloud", ".site");
    } else if (convexUrl?.includes("127.0.0.1:3210") || convexUrl?.includes("localhost:3210")) {
      convexSiteUrl = convexUrl.replace(":3210", ":3211");
    }
    const tileSources = dziUrl && convexSiteUrl
      ? `${convexSiteUrl}${dziUrl}`
      : { type: "image", url: imageUrl };

    // Create viewer
    const viewer = OpenSeadragon({
      element: containerRef.current,
      prefixUrl: "",
      tileSources,
      showNavigationControl: false,
      showZoomControl: false,
      showHomeControl: false,
      showFullPageControl: false,
      showRotationControl: false,
      // Allow full resolution zoom with DZI tiles
      maxZoomPixelRatio: dziUrl ? 1 : 2,
      minZoomLevel: 0.5,
      visibilityRatio: 0.5,
      constrainDuringPan: true,
      animationTime: 0.3,
      springStiffness: 10,
      gestureSettingsMouse: {
        scrollToZoom: true,
        clickToZoom: true,
        dblClickToZoom: true,
        pinchToZoom: true,
        flickEnabled: true,
        flickMinSpeed: 120,
        flickMomentum: 0.25,
      },
      gestureSettingsTouch: {
        scrollToZoom: false,
        clickToZoom: false,
        dblClickToZoom: true,
        pinchToZoom: true,
        flickEnabled: true,
        flickMinSpeed: 120,
        flickMomentum: 0.25,
      },
    });

    viewerRef.current = viewer;

    // Track loading state
    viewer.addHandler("open", () => {
      setIsLoading(false);
    });

    // Track zoom level
    viewer.addHandler("zoom", (event) => {
      const minZoom = viewer.viewport.getMinZoom();
      const maxZoom = viewer.viewport.getMaxZoom();
      const currentZoom = event.zoom || 1;
      const normalized = (currentZoom - minZoom) / (maxZoom - minZoom);
      setZoomLevel(Math.round(normalized * 100));
    });

    return () => {
      viewer.destroy();
      viewerRef.current = null;
      document.body.style.overflow = "";
    };
  }, [isOpen, imageUrl, dziUrl]);

  const handleZoomIn = () => {
    viewerRef.current?.viewport.zoomBy(1.5);
  };

  const handleZoomOut = () => {
    viewerRef.current?.viewport.zoomBy(0.67);
  };

  const handleResetZoom = () => {
    viewerRef.current?.viewport.goHome();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50
        bg-[var(--color-gallery-bg)]/[0.97]
        backdrop-blur-sm
        transition-opacity duration-300 ease-[var(--transition-elegant)]
        ${isClosing ? 'opacity-0' : 'opacity-100'}
      `}
      role="dialog"
      aria-modal="true"
      aria-label={`Viewing ${title}`}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-8 h-8 border border-[var(--color-gallery-border)] border-t-[var(--color-gallery-text)] rounded-full animate-spin" />
        </div>
      )}

      {/* OpenSeadragon container */}
      <div
        ref={containerRef}
        className={`
          absolute inset-0
          transition-all duration-300 ease-[var(--transition-elegant)]
          ${isClosing ? 'opacity-90' : 'opacity-100'}
        `}
        data-testid="image-viewer-container"
      />

      {/* Close button */}
      <button
        onClick={handleClose}
        className="
          absolute top-4 right-4 lg:top-6 lg:right-6 z-20
          w-10 h-10 flex items-center justify-center
          border border-[var(--color-gallery-border)]
          bg-[var(--color-gallery-surface)]/90 hover:bg-[var(--color-gallery-surface)]
          text-[var(--color-gallery-muted)] hover:text-[var(--color-gallery-text)]
          transition-all duration-300 ease-[var(--transition-elegant)]
          hover:border-[var(--color-gallery-subtle)]
        "
        aria-label="Close viewer"
        data-testid="close-viewer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Controls */}
      <div
        className="
          absolute bottom-4 left-1/2 -translate-x-1/2 z-20
          lg:bottom-6
          flex items-center gap-1
          border border-[var(--color-gallery-border)]
          bg-[var(--color-gallery-surface)]/90
          px-2 py-1.5
        "
      >
        <button
          onClick={handleZoomOut}
          className="
            w-8 h-8 flex items-center justify-center
            text-[var(--color-gallery-muted)] hover:text-[var(--color-gallery-text)]
            transition-colors duration-300
          "
          aria-label="Zoom out"
          data-testid="zoom-out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
          </svg>
        </button>

        <div
          className="
            w-14 text-center text-[0.7rem] tracking-[0.1em]
            text-[var(--color-gallery-subtle)] font-[var(--font-sans)]
          "
          aria-label={`Zoom level: ${zoomLevel}%`}
        >
          {zoomLevel}%
        </div>

        <button
          onClick={handleZoomIn}
          className="
            w-8 h-8 flex items-center justify-center
            text-[var(--color-gallery-muted)] hover:text-[var(--color-gallery-text)]
            transition-colors duration-300
          "
          aria-label="Zoom in"
          data-testid="zoom-in"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <div className="w-[1px] h-4 bg-[var(--color-gallery-border)] mx-1" />

        <button
          onClick={handleResetZoom}
          className="
            w-8 h-8 flex items-center justify-center
            text-[var(--color-gallery-muted)] hover:text-[var(--color-gallery-text)]
            transition-colors duration-300
          "
          aria-label="Reset zoom"
          data-testid="reset-zoom"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <div
        className="
          absolute top-4 left-4 lg:top-6 lg:left-6 z-20
          max-w-[50%]
          border border-[var(--color-gallery-border)]
          bg-[var(--color-gallery-surface)]/90
          px-4 py-2
        "
      >
        <h2 className="text-[var(--color-gallery-text)] text-[0.8rem] font-light tracking-[0.02em] truncate">
          {title}
        </h2>
      </div>

      {/* Instructions */}
      <div
        className="
          absolute bottom-16 lg:bottom-18 left-1/2 -translate-x-1/2 z-10
          text-[var(--color-gallery-subtle)] text-[0.7rem] tracking-[0.1em] uppercase text-center
          pointer-events-none
          font-[var(--font-sans)] font-light
        "
      >
        <p>Scroll to zoom · Drag to pan</p>
      </div>
    </div>
  );
}

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

  const handleClose = useCallback(() => {
    onClose();
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
      className="fixed inset-0 z-50 bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={`Viewing ${title}`}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* OpenSeadragon container */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        data-testid="image-viewer-container"
      />

      {/* Close button */}
      <button
        onClick={handleClose}
        className="
          absolute top-4 right-4 z-20
          w-10 h-10 flex items-center justify-center
          bg-black/50 hover:bg-black/70
          text-white/80 hover:text-white
          rounded-full
          transition-all duration-200
          backdrop-blur-sm
        "
        aria-label="Close viewer"
        data-testid="close-viewer"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Controls */}
      <div
        className="
          absolute bottom-4 left-1/2 -translate-x-1/2 z-20
          flex items-center gap-2
          bg-black/50 backdrop-blur-sm
          px-3 py-2 rounded-full
        "
      >
        <button
          onClick={handleZoomOut}
          className="
            w-8 h-8 flex items-center justify-center
            text-white/80 hover:text-white
            transition-colors duration-200
          "
          aria-label="Zoom out"
          data-testid="zoom-out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
          </svg>
        </button>

        <div
          className="w-12 text-center text-sm text-white/60 font-mono"
          aria-label={`Zoom level: ${zoomLevel}%`}
        >
          {zoomLevel}%
        </div>

        <button
          onClick={handleZoomIn}
          className="
            w-8 h-8 flex items-center justify-center
            text-white/80 hover:text-white
            transition-colors duration-200
          "
          aria-label="Zoom in"
          data-testid="zoom-in"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <div className="w-[1px] h-4 bg-white/20 mx-1" />

        <button
          onClick={handleResetZoom}
          className="
            w-8 h-8 flex items-center justify-center
            text-white/80 hover:text-white
            transition-colors duration-200
          "
          aria-label="Reset zoom"
          data-testid="reset-zoom"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <div
        className="
          absolute top-4 left-4 z-20
          max-w-[60%]
          bg-black/50 backdrop-blur-sm
          px-4 py-2 rounded-lg
        "
      >
        <h2 className="text-white/90 text-sm font-light truncate">{title}</h2>
      </div>

      {/* Instructions (hidden after first interaction) */}
      <div
        className="
          absolute bottom-20 left-1/2 -translate-x-1/2 z-10
          text-white/40 text-xs text-center
          pointer-events-none
        "
      >
        <p>Scroll to zoom · Drag to pan</p>
      </div>
    </div>
  );
}

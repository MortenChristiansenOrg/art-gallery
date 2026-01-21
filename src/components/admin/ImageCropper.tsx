import { useState, useRef, useEffect, useCallback } from "react";

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // width/height, e.g., 4/3
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropper({
  imageUrl,
  onCrop,
  onCancel,
  aspectRatio = 4 / 3,
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);

      // Calculate initial crop area centered, respecting aspect ratio
      const containerWidth = containerRef.current?.clientWidth || 600;
      const containerHeight = containerRef.current?.clientHeight || 400;

      // Scale image to fit container
      const imgScale = Math.min(
        containerWidth / img.width,
        containerHeight / img.height
      );
      setScale(imgScale);

      const displayWidth = img.width * imgScale;
      const displayHeight = img.height * imgScale;

      // Initial crop: 80% of image, centered, with aspect ratio
      let cropWidth = displayWidth * 0.8;
      let cropHeight = cropWidth / aspectRatio;

      if (cropHeight > displayHeight * 0.8) {
        cropHeight = displayHeight * 0.8;
        cropWidth = cropHeight * aspectRatio;
      }

      setCropArea({
        x: (displayWidth - cropWidth) / 2,
        y: (displayHeight - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
    };
    img.src = imageUrl;
  }, [imageUrl, aspectRatio]);

  // Draw canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const displayWidth = image.width * scale;
    const displayHeight = image.height * scale;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Draw image
    ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

    // Draw darkened overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Clear crop area (show original brightness)
    ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    ctx.drawImage(
      image,
      cropArea.x / scale,
      cropArea.y / scale,
      cropArea.width / scale,
      cropArea.height / scale,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height
    );

    // Draw crop border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // Draw corner handles
    const handleSize = 10;
    ctx.fillStyle = "white";
    // Bottom-right handle (resize)
    ctx.fillRect(
      cropArea.x + cropArea.width - handleSize / 2,
      cropArea.y + cropArea.height - handleSize / 2,
      handleSize,
      handleSize
    );
  }, [image, cropArea, scale]);

  const getMousePos = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const pos = getMousePos(e);

      // Check if clicking resize handle (bottom-right corner)
      const handleSize = 20;
      const resizeHandleX = cropArea.x + cropArea.width;
      const resizeHandleY = cropArea.y + cropArea.height;

      if (
        Math.abs(pos.x - resizeHandleX) < handleSize &&
        Math.abs(pos.y - resizeHandleY) < handleSize
      ) {
        setIsResizing(true);
        setDragStart(pos);
        return;
      }

      // Check if clicking inside crop area
      if (
        pos.x >= cropArea.x &&
        pos.x <= cropArea.x + cropArea.width &&
        pos.y >= cropArea.y &&
        pos.y <= cropArea.y + cropArea.height
      ) {
        setIsDragging(true);
        setDragStart({ x: pos.x - cropArea.x, y: pos.y - cropArea.y });
      }
    },
    [cropArea, getMousePos]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!image) return;
      const pos = getMousePos(e);
      const displayWidth = image.width * scale;
      const displayHeight = image.height * scale;

      if (isDragging) {
        let newX = pos.x - dragStart.x;
        let newY = pos.y - dragStart.y;

        // Constrain to canvas bounds
        newX = Math.max(0, Math.min(newX, displayWidth - cropArea.width));
        newY = Math.max(0, Math.min(newY, displayHeight - cropArea.height));

        setCropArea((prev) => ({ ...prev, x: newX, y: newY }));
      } else if (isResizing) {
        let newWidth = pos.x - cropArea.x;
        let newHeight = newWidth / aspectRatio;

        // Minimum size
        newWidth = Math.max(100, newWidth);
        newHeight = Math.max(100 / aspectRatio, newHeight);

        // Constrain to canvas bounds
        newWidth = Math.min(newWidth, displayWidth - cropArea.x);
        newHeight = Math.min(newHeight, displayHeight - cropArea.y);

        // Maintain aspect ratio
        if (newWidth / aspectRatio > displayHeight - cropArea.y) {
          newHeight = displayHeight - cropArea.y;
          newWidth = newHeight * aspectRatio;
        }

        setCropArea((prev) => ({ ...prev, width: newWidth, height: newHeight }));
      }
    },
    [image, isDragging, isResizing, dragStart, cropArea, scale, aspectRatio, getMousePos]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleCrop = useCallback(() => {
    if (!image) return;

    // Create a new canvas for the cropped image
    const outputCanvas = document.createElement("canvas");
    const outputCtx = outputCanvas.getContext("2d");
    if (!outputCtx) return;

    // Calculate source coordinates in original image space
    const srcX = cropArea.x / scale;
    const srcY = cropArea.y / scale;
    const srcWidth = cropArea.width / scale;
    const srcHeight = cropArea.height / scale;

    // Output at reasonable size (max 1200px wide for cover)
    const maxOutputWidth = 1200;
    const outputWidth = Math.min(srcWidth, maxOutputWidth);
    const outputHeight = outputWidth / aspectRatio;

    outputCanvas.width = outputWidth;
    outputCanvas.height = outputHeight;

    outputCtx.drawImage(
      image,
      srcX,
      srcY,
      srcWidth,
      srcHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          onCrop(blob);
        }
      },
      "image/jpeg",
      0.9
    );
  }, [image, cropArea, scale, aspectRatio, onCrop]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--color-gallery-bg)] p-6 rounded-lg max-w-4xl w-full">
        <h3 className="font-[var(--font-serif)] text-lg mb-4">Crop Cover Image</h3>

        <div
          ref={containerRef}
          className="relative bg-black flex items-center justify-center overflow-hidden"
          style={{ height: "60vh", maxHeight: "500px" }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            className="cursor-move"
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        </div>

        <p className="mt-3 text-sm text-[var(--color-gallery-muted)]">
          Drag to move, drag corner to resize
        </p>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-[var(--color-gallery-border)] text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="flex-1 px-4 py-2 bg-[var(--color-gallery-text)] text-[var(--color-gallery-bg)] text-sm"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}

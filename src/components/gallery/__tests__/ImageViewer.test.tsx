import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImageViewer } from "../ImageViewer";

// Mock OpenSeadragon
const mockDestroy = vi.fn();
const mockZoomBy = vi.fn();
const mockGoHome = vi.fn();
const mockGetMinZoom = vi.fn(() => 0.5);
const mockGetMaxZoom = vi.fn(() => 2);
const mockAddHandler = vi.fn();

vi.mock("openseadragon", () => ({
  default: vi.fn(() => ({
    destroy: mockDestroy,
    viewport: {
      zoomBy: mockZoomBy,
      goHome: mockGoHome,
      getMinZoom: mockGetMinZoom,
      getMaxZoom: mockGetMaxZoom,
    },
    addHandler: mockAddHandler,
  })),
}));

describe("ImageViewer", () => {
  const defaultProps = {
    imageUrl: "https://example.com/artwork.jpg",
    title: "Test Artwork",
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("renders nothing when closed", () => {
    const { container } = render(<ImageViewer {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders viewer when open", () => {
    render(<ImageViewer {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows artwork title", () => {
    render(<ImageViewer {...defaultProps} />);
    expect(screen.getByText("Test Artwork")).toBeInTheDocument();
  });

  it("has accessible dialog label", () => {
    render(<ImageViewer {...defaultProps} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "Viewing Test Artwork");
  });

  it("calls onClose when close button clicked", () => {
    render(<ImageViewer {...defaultProps} />);
    const closeButton = screen.getByTestId("close-viewer");
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape key", () => {
    render(<ImageViewer {...defaultProps} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("prevents body scroll when open", () => {
    render(<ImageViewer {...defaultProps} />);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body scroll on unmount", () => {
    const { unmount } = render(<ImageViewer {...defaultProps} />);
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("shows loading indicator initially", () => {
    render(<ImageViewer {...defaultProps} />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders zoom controls", () => {
    render(<ImageViewer {...defaultProps} />);
    expect(screen.getByTestId("zoom-in")).toBeInTheDocument();
    expect(screen.getByTestId("zoom-out")).toBeInTheDocument();
    expect(screen.getByTestId("reset-zoom")).toBeInTheDocument();
  });

  it("zoom in button calls viewport.zoomBy", () => {
    render(<ImageViewer {...defaultProps} />);
    const zoomInBtn = screen.getByTestId("zoom-in");
    fireEvent.click(zoomInBtn);
    expect(mockZoomBy).toHaveBeenCalledWith(1.5);
  });

  it("zoom out button calls viewport.zoomBy", () => {
    render(<ImageViewer {...defaultProps} />);
    const zoomOutBtn = screen.getByTestId("zoom-out");
    fireEvent.click(zoomOutBtn);
    expect(mockZoomBy).toHaveBeenCalledWith(0.67);
  });

  it("reset button calls viewport.goHome", () => {
    render(<ImageViewer {...defaultProps} />);
    const resetBtn = screen.getByTestId("reset-zoom");
    fireEvent.click(resetBtn);
    expect(mockGoHome).toHaveBeenCalled();
  });

  it("has accessible close button", () => {
    render(<ImageViewer {...defaultProps} />);
    const closeButton = screen.getByLabelText("Close viewer");
    expect(closeButton).toBeInTheDocument();
  });

  it("has accessible zoom buttons", () => {
    render(<ImageViewer {...defaultProps} />);
    expect(screen.getByLabelText("Zoom in")).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom out")).toBeInTheDocument();
    expect(screen.getByLabelText("Reset zoom")).toBeInTheDocument();
  });

  it("shows usage instructions", () => {
    render(<ImageViewer {...defaultProps} />);
    expect(screen.getByText(/Scroll to zoom/)).toBeInTheDocument();
  });

  it("destroys OpenSeadragon on unmount", () => {
    const { unmount } = render(<ImageViewer {...defaultProps} />);
    unmount();
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("reinitializes when imageUrl changes", async () => {
    const { rerender } = render(<ImageViewer {...defaultProps} />);

    const OpenSeadragon = (await import("openseadragon")).default;
    expect(OpenSeadragon).toHaveBeenCalledTimes(1);

    rerender(<ImageViewer {...defaultProps} imageUrl="https://example.com/new.jpg" />);

    expect(mockDestroy).toHaveBeenCalled();
  });

  it("renders OpenSeadragon container", () => {
    render(<ImageViewer {...defaultProps} />);
    expect(screen.getByTestId("image-viewer-container")).toBeInTheDocument();
  });

  it("accepts optional dziUrl prop", () => {
    render(<ImageViewer {...defaultProps} dziUrl="/dzi/abc123.dzi" />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("reinitializes when dziUrl changes", () => {
    const { rerender } = render(<ImageViewer {...defaultProps} dziUrl={null} />);

    rerender(<ImageViewer {...defaultProps} dziUrl="/dzi/abc123.dzi" />);

    expect(mockDestroy).toHaveBeenCalled();
  });
});

describe("ImageViewer DZI URL construction", () => {
  const originalEnv = import.meta.env.VITE_CONVEX_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
    // Reset env
    if (originalEnv !== undefined) {
      vi.stubEnv("VITE_CONVEX_URL", originalEnv);
    }
  });

  it("constructs correct DZI URL for cloud deployment (.cloud -> .site)", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "https://happy-panda-123.convex.cloud");

    render(
      <ImageViewer
        imageUrl="https://example.com/image.jpg"
        dziUrl="/dzi/abc123.dzi"
        title="Test"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const OpenSeadragon = (await import("openseadragon")).default;
    expect(OpenSeadragon).toHaveBeenCalled();
    const callArgs = vi.mocked(OpenSeadragon).mock.calls[0][0];
    expect(callArgs.tileSources).toBe("https://happy-panda-123.convex.site/dzi/abc123.dzi");
  });

  it("constructs correct DZI URL for local dev with 127.0.0.1 (port 3210 -> 3211)", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "http://127.0.0.1:3210");

    render(
      <ImageViewer
        imageUrl="https://example.com/image.jpg"
        dziUrl="/dzi/abc123.dzi"
        title="Test"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const OpenSeadragon = (await import("openseadragon")).default;
    expect(OpenSeadragon).toHaveBeenCalled();
    const callArgs = vi.mocked(OpenSeadragon).mock.calls[0][0];
    expect(callArgs.tileSources).toBe("http://127.0.0.1:3211/dzi/abc123.dzi");
  });

  it("constructs correct DZI URL for local dev with localhost (port 3210 -> 3211)", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "http://localhost:3210");

    render(
      <ImageViewer
        imageUrl="https://example.com/image.jpg"
        dziUrl="/dzi/abc123.dzi"
        title="Test"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const OpenSeadragon = (await import("openseadragon")).default;
    expect(OpenSeadragon).toHaveBeenCalled();
    const callArgs = vi.mocked(OpenSeadragon).mock.calls[0][0];
    expect(callArgs.tileSources).toBe("http://localhost:3211/dzi/abc123.dzi");
  });

  it("falls back to simple image when no DZI URL provided", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "https://happy-panda-123.convex.cloud");

    render(
      <ImageViewer
        imageUrl="https://example.com/image.jpg"
        title="Test"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const OpenSeadragon = (await import("openseadragon")).default;
    expect(OpenSeadragon).toHaveBeenCalled();
    const callArgs = vi.mocked(OpenSeadragon).mock.calls[0][0];
    expect(callArgs.tileSources).toEqual({ type: "image", url: "https://example.com/image.jpg" });
  });

  it("falls back to simple image when CONVEX_URL is undefined", async () => {
    vi.stubEnv("VITE_CONVEX_URL", undefined as unknown as string);

    render(
      <ImageViewer
        imageUrl="https://example.com/image.jpg"
        dziUrl="/dzi/abc123.dzi"
        title="Test"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const OpenSeadragon = (await import("openseadragon")).default;
    expect(OpenSeadragon).toHaveBeenCalled();
    const callArgs = vi.mocked(OpenSeadragon).mock.calls[0][0];
    expect(callArgs.tileSources).toEqual({ type: "image", url: "https://example.com/image.jpg" });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "../../test/test-utils";
import { ImageViewer } from "./ImageViewer";

// Mock OpenSeadragon
vi.mock("openseadragon", () => ({
  default: vi.fn(() => ({
    addHandler: vi.fn(),
    destroy: vi.fn(),
    viewport: {
      zoomBy: vi.fn(),
      goHome: vi.fn(),
      getMinZoom: vi.fn().mockReturnValue(0.5),
      getMaxZoom: vi.fn().mockReturnValue(2),
    },
  })),
}));

const defaultProps = {
  imageUrl: "https://example.com/image.jpg",
  dziUrl: null,
  title: "Test Artwork",
  isOpen: true,
  onClose: vi.fn(),
};

describe("ImageViewer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("open/close behavior", () => {
    it("renders when isOpen is true", () => {
      render(<ImageViewer {...defaultProps} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
      render(<ImageViewer {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("calls onClose when close button is clicked", () => {
      const onClose = vi.fn();
      render(<ImageViewer {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId("close-viewer"));
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(onClose).toHaveBeenCalledOnce();
    });

    it("displays title in viewer", () => {
      render(<ImageViewer {...defaultProps} title="My Beautiful Art" />);
      expect(screen.getByText("My Beautiful Art")).toBeInTheDocument();
    });
  });

  describe("zoom controls", () => {
    it("renders zoom in button", () => {
      render(<ImageViewer {...defaultProps} />);
      expect(screen.getByTestId("zoom-in")).toBeInTheDocument();
    });

    it("renders zoom out button", () => {
      render(<ImageViewer {...defaultProps} />);
      expect(screen.getByTestId("zoom-out")).toBeInTheDocument();
    });

    it("renders reset zoom button", () => {
      render(<ImageViewer {...defaultProps} />);
      expect(screen.getByTestId("reset-zoom")).toBeInTheDocument();
    });

    it("displays zoom level indicator", () => {
      render(<ImageViewer {...defaultProps} />);
      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });

  describe("keyboard navigation", () => {
    it("closes on Escape key press", () => {
      const onClose = vi.fn();
      render(<ImageViewer {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(window, { key: "Escape" });
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(onClose).toHaveBeenCalledOnce();
    });

    it("does not close on other key presses", () => {
      const onClose = vi.fn();
      render(<ImageViewer {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(window, { key: "Enter" });
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("has dialog role", () => {
      render(<ImageViewer {...defaultProps} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("has aria-modal attribute", () => {
      render(<ImageViewer {...defaultProps} />);
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    });

    it("has aria-label with title", () => {
      render(<ImageViewer {...defaultProps} title="Sunset Painting" />);
      expect(screen.getByRole("dialog")).toHaveAttribute(
        "aria-label",
        "Viewing Sunset Painting"
      );
    });

    it("close button has accessible label", () => {
      render(<ImageViewer {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: /close viewer/i })
      ).toBeInTheDocument();
    });

    it("zoom buttons have accessible labels", () => {
      render(<ImageViewer {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: /zoom in/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /zoom out/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /reset zoom/i })
      ).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows loading indicator initially", () => {
      const { container } = render(<ImageViewer {...defaultProps} />);
      expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });
});

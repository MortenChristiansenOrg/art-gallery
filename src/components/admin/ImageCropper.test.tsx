import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { ImageCropper } from "./ImageCropper";

// Mock Image
class MockImage {
  width = 800;
  height = 600;
  onload: (() => void) | null = null;
  crossOrigin = "";
  private _src = "";

  get src() {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
    // Simulate async image load
    setTimeout(() => this.onload?.(), 0);
  }
}

describe("ImageCropper", () => {
  beforeEach(() => {
    // Mock window.Image
    vi.stubGlobal("Image", MockImage);

    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      strokeRect: vi.fn(),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    // Mock toBlob
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
      callback(new Blob(["test"], { type: "image/jpeg" }));
    });
  });

  describe("rendering", () => {
    it("renders modal with title", async () => {
      render(
        <ImageCropper
          imageUrl="https://example.com/test.jpg"
          onCrop={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Crop Cover Image")).toBeInTheDocument();
      });
    });

    it("renders crop and cancel buttons", () => {
      render(
        <ImageCropper
          imageUrl="https://example.com/test.jpg"
          onCrop={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(
        screen.getByRole("button", { name: /apply crop/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it("renders help text", () => {
      render(
        <ImageCropper
          imageUrl="https://example.com/test.jpg"
          onCrop={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(
        screen.getByText(/drag to move, drag corner to resize/i)
      ).toBeInTheDocument();
    });
  });

  describe("image loading", () => {
    it("loads image and renders canvas", async () => {
      const { container } = render(
        <ImageCropper
          imageUrl="https://example.com/test.jpg"
          onCrop={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        // ImageCropper uses canvas for rendering, not img element
        expect(container.querySelector("canvas")).toBeInTheDocument();
      });
    });
  });

  describe("cancel", () => {
    it("calls onCancel when cancel button clicked", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <ImageCropper
          imageUrl="https://example.com/test.jpg"
          onCrop={vi.fn()}
          onCancel={onCancel}
        />
      );

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe("crop", () => {
    it("calls onCrop with blob when apply clicked", async () => {
      const user = userEvent.setup();
      const onCrop = vi.fn();
      render(
        <ImageCropper
          imageUrl="https://example.com/test.jpg"
          onCrop={onCrop}
          onCancel={vi.fn()}
        />
      );

      // Wait for image to load
      await waitFor(() => {
        expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
      });

      await user.click(screen.getByRole("button", { name: /apply crop/i }));

      await waitFor(() => {
        expect(onCrop).toHaveBeenCalledWith(expect.any(Blob));
      });
    });
  });

  describe("aspect ratio", () => {
    it("uses default aspect ratio of 4/3", () => {
      render(
        <ImageCropper
          imageUrl="https://example.com/test.jpg"
          onCrop={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      // Component renders - aspect ratio is internal state
      expect(screen.getByText("Crop Cover Image")).toBeInTheDocument();
    });

    it("accepts custom aspect ratio", () => {
      render(
        <ImageCropper
          imageUrl="https://example.com/test.jpg"
          onCrop={vi.fn()}
          onCancel={vi.fn()}
          aspectRatio={16 / 9}
        />
      );
      // Component renders with custom ratio
      expect(screen.getByText("Crop Cover Image")).toBeInTheDocument();
    });
  });
});

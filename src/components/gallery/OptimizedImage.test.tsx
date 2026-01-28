import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "../../test/test-utils";
import { OptimizedImage } from "./OptimizedImage";

describe("OptimizedImage", () => {
  describe("placeholder states", () => {
    it("shows 'No image' when src is null", () => {
      render(<OptimizedImage src={null} alt="Test" />);
      expect(screen.getByText("No image")).toBeInTheDocument();
    });

    it("shows loading state before image loads", () => {
      render(
        <OptimizedImage src="https://example.com/test.jpg" alt="Test" />
      );
      // Image should be hidden (opacity-0) while loading
      const img = screen.getByAltText("Test");
      expect(img).toHaveClass("opacity-0");
    });

    it("shows image after load completes", async () => {
      render(
        <OptimizedImage src="https://example.com/test.jpg" alt="Test" />
      );

      const img = screen.getByAltText("Test");
      fireEvent.load(img);

      await waitFor(() => {
        expect(img).toHaveClass("opacity-100");
      });
    });
  });

  describe("error handling", () => {
    it("shows 'Failed to load' on error", async () => {
      render(<OptimizedImage src="https://example.com/bad.jpg" alt="Test" />);

      const img = screen.getByAltText("Test");
      fireEvent.error(img);

      await waitFor(() => {
        expect(screen.getByText("Failed to load")).toBeInTheDocument();
      });
    });
  });

  describe("onLoad callback", () => {
    it("calls onLoad when image loads", async () => {
      const handleLoad = vi.fn();
      render(
        <OptimizedImage
          src="https://example.com/test.jpg"
          alt="Test"
          onLoad={handleLoad}
        />
      );

      const img = screen.getByAltText("Test");
      fireEvent.load(img);

      await waitFor(() => {
        expect(handleLoad).toHaveBeenCalledOnce();
      });
    });
  });

  describe("image attributes", () => {
    it("applies alt text correctly", () => {
      render(
        <OptimizedImage src="https://example.com/test.jpg" alt="My Artwork" />
      );
      expect(screen.getByAltText("My Artwork")).toBeInTheDocument();
    });

    it("applies lazy loading by default", () => {
      render(<OptimizedImage src="https://example.com/test.jpg" alt="Test" />);
      expect(screen.getByAltText("Test")).toHaveAttribute("loading", "lazy");
    });

    it("applies eager loading when specified", () => {
      render(
        <OptimizedImage
          src="https://example.com/test.jpg"
          alt="Test"
          loading="eager"
        />
      );
      expect(screen.getByAltText("Test")).toHaveAttribute("loading", "eager");
    });

    it("applies custom className", async () => {
      render(
        <OptimizedImage
          src="https://example.com/test.jpg"
          alt="Test"
          className="custom-class"
        />
      );

      const img = screen.getByAltText("Test");
      expect(img).toHaveClass("custom-class");
    });
  });

  describe("aspect ratio", () => {
    it("applies default aspect ratio of 4/5", () => {
      const { container } = render(
        <OptimizedImage src="https://example.com/test.jpg" alt="Test" />
      );
      expect(container.firstChild).toHaveStyle({ aspectRatio: "4/5" });
    });

    it("applies custom aspect ratio", () => {
      const { container } = render(
        <OptimizedImage
          src="https://example.com/test.jpg"
          alt="Test"
          aspectRatio="16/9"
        />
      );
      expect(container.firstChild).toHaveStyle({ aspectRatio: "16/9" });
    });
  });

  describe("src changes", () => {
    it("resets loading state when src changes", async () => {
      const { rerender } = render(
        <OptimizedImage src="https://example.com/first.jpg" alt="Test" />
      );

      const img = screen.getByAltText("Test");
      fireEvent.load(img);

      await waitFor(() => {
        expect(img).toHaveClass("opacity-100");
      });

      rerender(
        <OptimizedImage src="https://example.com/second.jpg" alt="Test" />
      );

      // After src changes, image should be hidden again while loading
      const newImg = screen.getByAltText("Test");
      expect(newImg).toHaveClass("opacity-0");
    });
  });
});

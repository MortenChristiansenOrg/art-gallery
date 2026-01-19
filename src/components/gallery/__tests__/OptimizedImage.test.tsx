import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { OptimizedImage } from "../OptimizedImage";

describe("OptimizedImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders placeholder when src is null", () => {
    render(<OptimizedImage src={null} alt="Test image" />);
    expect(screen.getByText("No image")).toBeInTheDocument();
  });

  it("shows shimmer placeholder while loading", () => {
    render(<OptimizedImage src="https://example.com/image.jpg" alt="Test image" />);
    const shimmer = document.querySelector(".skeleton-shimmer");
    expect(shimmer).toBeInTheDocument();
  });

  it("renders image with correct alt text", () => {
    render(<OptimizedImage src="https://example.com/image.jpg" alt="Test artwork" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "Test artwork");
    expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
  });

  it("applies lazy loading by default", () => {
    render(<OptimizedImage src="https://example.com/image.jpg" alt="Test" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("supports eager loading", () => {
    render(<OptimizedImage src="https://example.com/image.jpg" alt="Test" loading="eager" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("loading", "eager");
  });

  it("applies custom className to image", () => {
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test"
        className="custom-class"
      />
    );
    const img = screen.getByRole("img");
    expect(img.className).toContain("custom-class");
  });

  it("calls onLoad callback when image loads", async () => {
    const onLoad = vi.fn();
    render(
      <OptimizedImage
        src="https://example.com/image.jpg"
        alt="Test"
        onLoad={onLoad}
      />
    );

    const img = screen.getByRole("img");
    fireEvent.load(img);

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledTimes(1);
    });
  });

  it("shows error state when image fails to load", async () => {
    render(<OptimizedImage src="https://example.com/broken.jpg" alt="Test" />);

    const img = screen.getByRole("img");
    fireEvent.error(img);

    await waitFor(() => {
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });
  });

  it("hides shimmer after image loads", async () => {
    render(<OptimizedImage src="https://example.com/image.jpg" alt="Test" />);

    const img = screen.getByRole("img");
    fireEvent.load(img);

    await waitFor(() => {
      const shimmer = document.querySelector(".skeleton-shimmer");
      expect(shimmer).not.toBeInTheDocument();
    });
  });

  it("resets loading state when src changes", async () => {
    const { rerender } = render(
      <OptimizedImage src="https://example.com/image1.jpg" alt="Test" />
    );

    const img = screen.getByRole("img");
    fireEvent.load(img);

    await waitFor(() => {
      expect(img.className).toContain("opacity-100");
    });

    rerender(<OptimizedImage src="https://example.com/image2.jpg" alt="Test" />);

    await waitFor(() => {
      const shimmer = document.querySelector(".skeleton-shimmer");
      expect(shimmer).toBeInTheDocument();
    });
  });

  it("uses custom aspect ratio", () => {
    const { container } = render(
      <OptimizedImage src="https://example.com/image.jpg" alt="Test" aspectRatio="16/9" />
    );
    const wrapper = container.querySelector("div[style]");
    expect(wrapper).toHaveStyle({ aspectRatio: "16/9" });
  });
});

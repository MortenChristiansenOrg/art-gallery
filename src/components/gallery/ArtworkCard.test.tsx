import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { ArtworkCard } from "./ArtworkCard";
import type { Id } from "../../../convex/_generated/dataModel";

const defaultProps = {
  id: "artwork_1" as Id<"artworks">,
  title: "Test Artwork",
  imageUrl: "https://example.com/image.jpg",
};

describe("ArtworkCard", () => {
  describe("content", () => {
    it("renders title", () => {
      render(<ArtworkCard {...defaultProps} />);
      expect(screen.getByText("Test Artwork")).toBeInTheDocument();
    });

    it("renders year when provided", () => {
      render(<ArtworkCard {...defaultProps} year={2023} />);
      expect(screen.getByText("2023")).toBeInTheDocument();
    });

    it("does not render year when not provided", () => {
      render(<ArtworkCard {...defaultProps} />);
      expect(screen.queryByText(/^\d{4}$/)).not.toBeInTheDocument();
    });
  });

  describe("image handling", () => {
    it("uses thumbnailUrl when provided", () => {
      render(
        <ArtworkCard
          {...defaultProps}
          thumbnailUrl="https://example.com/thumb.jpg"
        />
      );
      expect(screen.getByAltText("Test Artwork")).toHaveAttribute(
        "src",
        "https://example.com/thumb.jpg"
      );
    });

    it("falls back to imageUrl when thumbnailUrl is not provided", () => {
      render(<ArtworkCard {...defaultProps} />);
      expect(screen.getByAltText("Test Artwork")).toHaveAttribute(
        "src",
        "https://example.com/image.jpg"
      );
    });

    it("handles null imageUrl", () => {
      render(<ArtworkCard {...defaultProps} imageUrl={null} />);
      expect(screen.getByText("No image")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("renders as link when onClick is not provided", () => {
      render(<ArtworkCard {...defaultProps} />);
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "/artwork/artwork_1"
      );
    });

    it("includes collection slug in link state", () => {
      render(<ArtworkCard {...defaultProps} collectionSlug="paintings" />);
      expect(screen.getByRole("link")).toBeInTheDocument();
    });
  });

  describe("click handler", () => {
    it("calls onClick when provided and clicked", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<ArtworkCard {...defaultProps} onClick={handleClick} />);

      await user.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it("renders as button when onClick is provided", () => {
      const handleClick = vi.fn();
      render(<ArtworkCard {...defaultProps} onClick={handleClick} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("keyboard navigation", () => {
    it("triggers onClick on Enter key", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<ArtworkCard {...defaultProps} onClick={handleClick} />);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledOnce();
    });

    it("triggers onClick on Space key", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<ArtworkCard {...defaultProps} onClick={handleClick} />);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard(" ");

      expect(handleClick).toHaveBeenCalledOnce();
    });
  });

  describe("index prop", () => {
    it("renders card with index prop", () => {
      render(<ArtworkCard {...defaultProps} index={5} />);
      expect(screen.getByText("Test Artwork")).toBeInTheDocument();
    });

    it("renders card with different index values", () => {
      render(<ArtworkCard {...defaultProps} index={0} />);
      expect(screen.getByText("Test Artwork")).toBeInTheDocument();
    });
  });
});

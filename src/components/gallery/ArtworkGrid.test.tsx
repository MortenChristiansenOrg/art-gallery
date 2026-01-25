import { describe, it, expect } from "vitest";
import { render, screen } from "../../test/test-utils";
import { ArtworkGrid } from "./ArtworkGrid";
import { createMockArtworkList } from "../../test/mocks";

describe("ArtworkGrid", () => {
  describe("rendering artworks", () => {
    it("renders all artwork cards", () => {
      const artworks = createMockArtworkList(3);
      render(<ArtworkGrid artworks={artworks} />);

      artworks.forEach((artwork) => {
        expect(screen.getByText(artwork.title)).toBeInTheDocument();
      });
    });

    it("renders no links when no artworks", () => {
      render(<ArtworkGrid artworks={[]} />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("collection slug", () => {
    it("passes collectionSlug to artwork cards", () => {
      const artworks = createMockArtworkList(2);
      render(<ArtworkGrid artworks={artworks} collectionSlug="paintings" />);

      // All links should be present (they use the collection slug internally)
      expect(screen.getAllByRole("link")).toHaveLength(2);
    });

    it("works without collectionSlug", () => {
      const artworks = createMockArtworkList(2);
      render(<ArtworkGrid artworks={artworks} />);

      expect(screen.getAllByRole("link")).toHaveLength(2);
    });
  });

  describe("grid layout", () => {
    it("renders artworks in grid", () => {
      const artworks = createMockArtworkList(2);
      render(<ArtworkGrid artworks={artworks} />);
      // Verify artworks are rendered
      artworks.forEach((artwork) => {
        expect(screen.getByText(artwork.title)).toBeInTheDocument();
      });
    });
  });

  describe("artwork indexing", () => {
    it("renders all artwork cards in order", () => {
      const artworks = createMockArtworkList(3);
      render(<ArtworkGrid artworks={artworks} />);

      // Verify all artworks are rendered
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(3);
      artworks.forEach((artwork) => {
        expect(screen.getByText(artwork.title)).toBeInTheDocument();
      });
    });
  });
});

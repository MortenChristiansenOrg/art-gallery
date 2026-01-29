import { describe, it, expect } from "vitest";
import { render, screen } from "../../test/test-utils";
import { CollectionsGrid } from "./CollectionsGrid";
import { createMockCollectionList } from "../../test/mocks";

describe("CollectionsGrid", () => {
  describe("rendering collections", () => {
    it("renders all collection cards", () => {
      const collections = createMockCollectionList(3);
      render(<CollectionsGrid collections={collections} />);

      collections.forEach((collection) => {
        expect(screen.getByText(collection.name)).toBeInTheDocument();
      });
    });

    it("renders no links when no collections", () => {
      render(<CollectionsGrid collections={[]} />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("grid layout", () => {
    it("renders collections in grid", () => {
      const collections = createMockCollectionList(2);
      render(<CollectionsGrid collections={collections} />);
      // Verify all collections are rendered
      collections.forEach((collection) => {
        expect(screen.getByText(collection.name)).toBeInTheDocument();
      });
      expect(screen.getAllByRole("link")).toHaveLength(2);
    });
  });
});

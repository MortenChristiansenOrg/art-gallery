import { describe, it, expect } from "vitest";
import { render, screen } from "../../test/test-utils";
import { CollectionsGrid } from "./CollectionsGrid";
import { createMockCollectionList } from "../../test/mocks";

describe("CollectionsGrid", () => {
  describe("rendering collections", () => {
    it("renders all collection cards", () => {
      const collections = createMockCollectionList(3);
      render(<CollectionsGrid collections={collections} uncategorizedCount={0} />);

      collections.forEach((collection) => {
        expect(screen.getByText(collection.name)).toBeInTheDocument();
      });
    });

    it("renders no links when no collections", () => {
      render(
        <CollectionsGrid collections={[]} uncategorizedCount={0} />
      );
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("cabinet card visibility", () => {
    it("shows cabinet card when uncategorizedCount > 0", () => {
      render(<CollectionsGrid collections={[]} uncategorizedCount={5} />);
      expect(screen.getByText("Cabinet of Curiosities")).toBeInTheDocument();
      expect(screen.getByText("5 works")).toBeInTheDocument();
    });

    it("hides cabinet card when uncategorizedCount is 0", () => {
      const collections = createMockCollectionList(2);
      render(<CollectionsGrid collections={collections} uncategorizedCount={0} />);
      expect(
        screen.queryByText("Cabinet of Curiosities")
      ).not.toBeInTheDocument();
    });

    it("displays cabinet card after all collection cards", () => {
      const collections = createMockCollectionList(2);
      render(<CollectionsGrid collections={collections} uncategorizedCount={3} />);

      const links = screen.getAllByRole("link");
      // Last link should be cabinet
      expect(links[links.length - 1]).toHaveAttribute(
        "href",
        "/collection/cabinet-of-curiosities"
      );
    });
  });

  describe("grid layout", () => {
    it("renders collections in grid", () => {
      const collections = createMockCollectionList(2);
      render(
        <CollectionsGrid collections={collections} uncategorizedCount={0} />
      );
      // Verify all collections are rendered
      collections.forEach((collection) => {
        expect(screen.getByText(collection.name)).toBeInTheDocument();
      });
      expect(screen.getAllByRole("link")).toHaveLength(2);
    });
  });
});

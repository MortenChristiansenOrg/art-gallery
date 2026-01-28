import { describe, it, expect } from "vitest";
import { render, screen } from "../../test/test-utils";
import { CollectionCard, CabinetCard } from "./CollectionCard";
import { createMockCollection } from "../../test/mocks";

describe("CollectionCard", () => {
  const mockCollection = createMockCollection({
    name: "Paintings",
    slug: "paintings",
    description: "A collection of paintings",
    artworkCount: 10,
    coverImageUrl: "https://example.com/cover.jpg",
  });

  describe("content", () => {
    it("renders collection name", () => {
      render(<CollectionCard collection={mockCollection} index={0} />);
      expect(screen.getByText("Paintings")).toBeInTheDocument();
    });

    it("renders description when provided", () => {
      render(<CollectionCard collection={mockCollection} index={0} />);
      expect(
        screen.getByText("A collection of paintings")
      ).toBeInTheDocument();
    });

    it("renders artwork count", () => {
      render(<CollectionCard collection={mockCollection} index={0} />);
      expect(screen.getByText("10 works")).toBeInTheDocument();
    });

    it("uses singular 'work' for count of 1", () => {
      const singleWork = createMockCollection({ artworkCount: 1 });
      render(<CollectionCard collection={singleWork} index={0} />);
      expect(screen.getByText("1 work")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("links to collection page using slug", () => {
      render(<CollectionCard collection={mockCollection} index={0} />);
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "/collection/paintings"
      );
    });
  });

  describe("cover image", () => {
    it("renders cover image when provided", () => {
      render(<CollectionCard collection={mockCollection} index={0} />);
      expect(screen.getByAltText("Paintings")).toBeInTheDocument();
    });

    it("shows fallback letter when no cover image", () => {
      const noImageCollection = createMockCollection({
        name: "Abstract",
        coverImageUrl: null,
      });
      render(<CollectionCard collection={noImageCollection} index={0} />);
      expect(screen.getByText("A")).toBeInTheDocument();
    });
  });

  describe("icon fallback", () => {
    it("renders icon SVG when provided and no cover image", () => {
      const iconCollection = createMockCollection({
        coverImageUrl: null,
        iconSvg: '<svg><path d="M0 0"/></svg>',
      });
      render(<CollectionCard collection={iconCollection} index={0} />);
      // Icon should be rendered, not the letter
      expect(screen.queryByText(iconCollection.name.charAt(0))).not.toBeInTheDocument();
    });
  });

  describe("animation", () => {
    it("applies animation delay based on index", () => {
      const { container } = render(
        <CollectionCard collection={mockCollection} index={3} />
      );
      const link = container.querySelector("a");
      expect(link).toHaveStyle({ animationDelay: "450ms" }); // 150 + 3*100
    });
  });
});

describe("CabinetCard", () => {
  describe("content", () => {
    it("renders Cabinet of Curiosities title", () => {
      render(<CabinetCard count={5} index={0} />);
      expect(screen.getByText("Cabinet of Curiosities")).toBeInTheDocument();
    });

    it("renders description text", () => {
      render(<CabinetCard count={5} index={0} />);
      expect(
        screen.getByText("Uncategorized works and experiments")
      ).toBeInTheDocument();
    });

    it("renders artwork count", () => {
      render(<CabinetCard count={7} index={0} />);
      expect(screen.getByText("7 works")).toBeInTheDocument();
    });

    it("uses singular 'work' for count of 1", () => {
      render(<CabinetCard count={1} index={0} />);
      expect(screen.getByText("1 work")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("links to cabinet of curiosities page", () => {
      render(<CabinetCard count={5} index={0} />);
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "/collection/cabinet-of-curiosities"
      );
    });
  });

  describe("animation", () => {
    it("applies animation delay based on index", () => {
      const { container } = render(<CabinetCard count={5} index={2} />);
      const link = container.querySelector("a");
      expect(link).toHaveStyle({ animationDelay: "350ms" }); // 150 + 2*100
    });
  });
});

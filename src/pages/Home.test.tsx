import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "../test/test-utils";
import { Home } from "./Home";
import { createMockCollectionList } from "../test/mocks";

// Mock module state
let mockCollections: ReturnType<typeof createMockCollectionList> | undefined;
let mockUncategorizedCount: number | undefined;
let callCount = 0;

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => {
    // Home calls useQuery twice: first listWithCounts, then getUncategorizedCount
    callCount++;
    if (callCount % 2 === 1) return mockCollections;
    return mockUncategorizedCount;
  }),
}));

describe("Home", () => {
  beforeEach(() => {
    mockCollections = undefined;
    mockUncategorizedCount = undefined;
    callCount = 0;
  });

  describe("loading state", () => {
    it("shows loading state while collections undefined", () => {
      mockCollections = undefined;
      mockUncategorizedCount = undefined;

      render(<Home />);
      // Content should not be visible yet - no collections or empty message
      expect(screen.queryByText("Collections")).not.toBeInTheDocument();
      expect(screen.queryByText("No collections to display")).not.toBeInTheDocument();
    });

    it("shows loading state while uncategorized count undefined", () => {
      mockCollections = [];
      mockUncategorizedCount = undefined;

      render(<Home />);
      // Content should not be visible yet - no collections or empty message
      expect(screen.queryByText("Collections")).not.toBeInTheDocument();
      expect(screen.queryByText("No collections to display")).not.toBeInTheDocument();
    });
  });

  describe("content loaded", () => {
    it("renders hero section", () => {
      mockCollections = createMockCollectionList(2);
      mockUncategorizedCount = 0;

      render(<Home />);
      expect(screen.getByText(/A curated space/i)).toBeInTheDocument();
      expect(screen.getByText(/for visual art/i)).toBeInTheDocument();
    });

    it("renders collections grid", () => {
      mockCollections = createMockCollectionList(3);
      mockUncategorizedCount = 0;

      render(<Home />);
      mockCollections.forEach((collection) => {
        expect(screen.getByText(collection.name)).toBeInTheDocument();
      });
    });

    it("renders Collections label", () => {
      mockCollections = createMockCollectionList(1);
      mockUncategorizedCount = 0;

      render(<Home />);
      expect(screen.getByText("Collections")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty message when no collections or uncategorized", () => {
      mockCollections = [];
      mockUncategorizedCount = 0;

      render(<Home />);
      expect(screen.getByText("No collections to display")).toBeInTheDocument();
    });
  });

  describe("with uncategorized content", () => {
    it("shows cabinet when uncategorized count > 0", () => {
      mockCollections = [];
      mockUncategorizedCount = 5;

      render(<Home />);
      expect(screen.getByText("Cabinet of Curiosities")).toBeInTheDocument();
    });

    it("shows content when only uncategorized exists", () => {
      mockCollections = [];
      mockUncategorizedCount = 3;

      render(<Home />);
      // Should not show empty message
      expect(
        screen.queryByText("No collections to display")
      ).not.toBeInTheDocument();
    });
  });
});

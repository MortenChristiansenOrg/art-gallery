import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "../test/test-utils";
import { Home } from "./Home";
import { createMockCollectionList } from "../test/mocks";

// Mock module state
let mockCollections: ReturnType<typeof createMockCollectionList> | undefined;

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => {
    return mockCollections;
  }),
  useMutation: vi.fn(() => vi.fn()),
}));

describe("Home", () => {
  beforeEach(() => {
    mockCollections = undefined;
  });

  describe("loading state", () => {
    it("shows loading state while collections undefined", () => {
      mockCollections = undefined;

      render(<Home />);
      expect(screen.queryByText("Collections")).not.toBeInTheDocument();
      expect(screen.queryByText("No collections to display")).not.toBeInTheDocument();
    });
  });

  describe("content loaded", () => {
    it("renders hero section", () => {
      mockCollections = createMockCollectionList(2);

      render(<Home />);
      expect(screen.getByText(/A curated space/i)).toBeInTheDocument();
      expect(screen.getByText(/for visual art/i)).toBeInTheDocument();
    });

    it("renders collections grid", () => {
      mockCollections = createMockCollectionList(3);

      render(<Home />);
      mockCollections.forEach((collection) => {
        expect(screen.getByText(collection.name)).toBeInTheDocument();
      });
    });

    it("renders Collections label", () => {
      mockCollections = createMockCollectionList(1);

      render(<Home />);
      expect(screen.getByText("Collections")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty message when no collections", () => {
      mockCollections = [];

      render(<Home />);
      expect(screen.getByText("No collections to display")).toBeInTheDocument();
    });
  });
});

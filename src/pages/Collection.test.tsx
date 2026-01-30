import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Collection } from "./Collection";
import { createMockArtworkList, createMockCollection } from "../test/mocks";

// Mock module state
let mockCollection: ReturnType<typeof createMockCollection> | null | undefined;
let mockArtworks: ReturnType<typeof createMockArtworkList> | undefined;

vi.mock("convex/react", () => ({
  useQuery: vi.fn((_query: unknown, args: unknown) => {
    if (args === "skip") return undefined;
    const argsObj = args as Record<string, unknown> | undefined;
    if (argsObj?.slug !== undefined) return mockCollection;
    if (argsObj?.collectionId !== undefined) return mockArtworks;
    return undefined;
  }),
}));

function renderCollection(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/collection/${slug}`]}>
      <Routes>
        <Route path="/collection/:slug" element={<Collection />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Collection", () => {
  beforeEach(() => {
    mockCollection = undefined;
    mockArtworks = undefined;
  });

  describe("loading state", () => {
    it("shows loading state while data is undefined", () => {
      mockCollection = undefined;
      mockArtworks = undefined;

      renderCollection("paintings");
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
      expect(screen.queryByText("Collection not found")).not.toBeInTheDocument();
    });
  });

  describe("404 state", () => {
    it("shows not found when collection is null", () => {
      mockCollection = null;
      mockArtworks = undefined;

      renderCollection("non-existent");
      expect(screen.getByText("Collection not found")).toBeInTheDocument();
    });

    it("shows link to return to collections", () => {
      mockCollection = null;

      renderCollection("non-existent");
      expect(
        screen.getByRole("link", { name: /return to collections/i })
      ).toBeInTheDocument();
    });
  });

  describe("regular collection", () => {
    it("renders collection title", () => {
      mockCollection = createMockCollection({ name: "Paintings" });
      mockArtworks = createMockArtworkList(3);

      renderCollection("paintings");
      expect(
        screen.getByRole("heading", { name: "Paintings" })
      ).toBeInTheDocument();
    });

    it("renders collection description", () => {
      mockCollection = createMockCollection({
        name: "Paintings",
        description: "A collection of beautiful paintings",
      });
      mockArtworks = createMockArtworkList(2);

      renderCollection("paintings");
      expect(
        screen.getByText("A collection of beautiful paintings")
      ).toBeInTheDocument();
    });

    it("renders artwork grid", () => {
      mockCollection = createMockCollection({ name: "Paintings" });
      mockArtworks = createMockArtworkList(3);

      renderCollection("paintings");
      mockArtworks.forEach((artwork) => {
        expect(screen.getByText(artwork.title)).toBeInTheDocument();
      });
    });

    it("shows back navigation", () => {
      mockCollection = createMockCollection({ name: "Paintings" });
      mockArtworks = [];

      renderCollection("paintings");
      expect(
        screen.getByRole("link", { name: /all collections/i })
      ).toBeInTheDocument();
    });
  });

  describe("empty collection", () => {
    it("shows empty message when no artworks", () => {
      mockCollection = createMockCollection({ name: "Empty" });
      mockArtworks = [];

      renderCollection("empty");
      expect(
        screen.getByText("No works in this collection")
      ).toBeInTheDocument();
    });
  });
});

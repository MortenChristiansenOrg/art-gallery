import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Artwork } from "./Artwork";
import { createMockArtwork, createMockCollectionList } from "../test/mocks";

// Mock module state
let mockArtwork: ReturnType<typeof createMockArtwork> | null | undefined;
let mockCollections: ReturnType<typeof createMockCollectionList> | undefined;

vi.mock("convex/react", () => ({
  useQuery: vi.fn((_query: unknown, args: unknown) => {
    if (args === "skip") return undefined;
    // Distinguish by args shape - artworks.get has id, collections.list has no args
    const argsObj = args as Record<string, unknown> | undefined;
    if (argsObj?.id !== undefined) return mockArtwork;
    // No args = collections.list
    return mockCollections;
  }),
}));

// Mock ImageViewer (OpenSeadragon is complex)
vi.mock("../components/gallery", () => ({
  ImageViewer: ({ isOpen, onClose, title }: { isOpen: boolean; onClose: () => void; title: string }) =>
    isOpen ? (
      <div data-testid="image-viewer" role="dialog">
        <span>{title}</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

function renderArtwork(id: string, state?: { fromCollection?: string }) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/artwork/${id}`, state }]}>
      <Routes>
        <Route path="/artwork/:id" element={<Artwork />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Artwork", () => {
  beforeEach(() => {
    mockArtwork = undefined;
    mockCollections = undefined;
  });

  describe("loading state", () => {
    it("shows loading state while data is undefined", () => {
      mockArtwork = undefined;

      renderArtwork("artwork_1");
      // Content should not be visible yet
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
      expect(screen.queryByText("Artwork not found")).not.toBeInTheDocument();
    });
  });

  describe("404 state", () => {
    it("shows not found when artwork is null", () => {
      mockArtwork = null;
      mockCollections = [];

      renderArtwork("non-existent");
      expect(screen.getByText("Artwork not found")).toBeInTheDocument();
    });

    it("shows link to return to collections", () => {
      mockArtwork = null;
      mockCollections = [];

      renderArtwork("non-existent");
      expect(
        screen.getByRole("link", { name: /return to collections/i })
      ).toBeInTheDocument();
    });
  });

  describe("content display", () => {
    it("renders artwork title", () => {
      mockArtwork = createMockArtwork({ title: "Beautiful Sunset" });
      mockCollections = [];

      renderArtwork("artwork_1");
      expect(
        screen.getByRole("heading", { name: "Beautiful Sunset" })
      ).toBeInTheDocument();
    });

    it("renders year when provided", () => {
      mockArtwork = createMockArtwork({ year: 2023 });
      mockCollections = [];

      renderArtwork("artwork_1");
      expect(screen.getByText("2023")).toBeInTheDocument();
    });

    it("renders medium when provided", () => {
      mockArtwork = createMockArtwork({ medium: "Oil on canvas" });
      mockCollections = [];

      renderArtwork("artwork_1");
      expect(screen.getByText("Oil on canvas")).toBeInTheDocument();
    });

    it("renders dimensions when provided", () => {
      mockArtwork = createMockArtwork({ dimensions: "24 x 36 in" });
      mockCollections = [];

      renderArtwork("artwork_1");
      expect(screen.getByText("24 x 36 in")).toBeInTheDocument();
    });

    it("renders description when provided", () => {
      mockArtwork = createMockArtwork({
        description: "A beautiful painting of a sunset",
      });
      mockCollections = [];

      renderArtwork("artwork_1");
      expect(
        screen.getByText("A beautiful painting of a sunset")
      ).toBeInTheDocument();
    });

    it("renders artwork image", () => {
      mockArtwork = createMockArtwork({
        title: "Test Art",
        viewerImageUrl: "https://example.com/viewer.jpg",
      });
      mockCollections = [];

      renderArtwork("artwork_1");
      expect(screen.getByAltText("Test Art")).toBeInTheDocument();
    });
  });

  describe("back navigation", () => {
    it("shows all collections link when no collection found", () => {
      mockArtwork = createMockArtwork();
      mockCollections = [];

      renderArtwork("artwork_1");
      expect(
        screen.getByRole("link", { name: /all collections/i })
      ).toBeInTheDocument();
    });

    it("shows back link to source collection", () => {
      const collections = createMockCollectionList(1);
      mockArtwork = createMockArtwork({ collectionId: collections[0]._id });
      mockCollections = collections;

      renderArtwork("artwork_1", { fromCollection: collections[0].slug });
      // There may be multiple links to the collection - one in nav, one in metadata
      const links = screen.getAllByRole("link", { name: new RegExp(collections[0].name, "i") });
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe("image viewer", () => {
    it("opens image viewer when image clicked", async () => {
      const user = userEvent.setup();
      mockArtwork = createMockArtwork({
        title: "Test Art",
        viewerImageUrl: "https://example.com/viewer.jpg",
      });
      mockCollections = [];

      renderArtwork("artwork_1");

      const imageButton = screen.getByRole("button", {
        name: /view artwork in fullscreen/i,
      });
      await user.click(imageButton);

      expect(screen.getByTestId("image-viewer")).toBeInTheDocument();
    });

    it("opens image viewer on Enter key", async () => {
      const user = userEvent.setup();
      mockArtwork = createMockArtwork({
        title: "Test Art",
        viewerImageUrl: "https://example.com/viewer.jpg",
      });
      mockCollections = [];

      renderArtwork("artwork_1");

      const imageButton = screen.getByRole("button", {
        name: /view artwork in fullscreen/i,
      });
      imageButton.focus();
      await user.keyboard("{Enter}");

      expect(screen.getByTestId("image-viewer")).toBeInTheDocument();
    });

    it("closes image viewer", async () => {
      const user = userEvent.setup();
      mockArtwork = createMockArtwork({
        title: "Test Art",
        viewerImageUrl: "https://example.com/viewer.jpg",
      });
      mockCollections = [];

      renderArtwork("artwork_1");

      await user.click(
        screen.getByRole("button", { name: /view artwork in fullscreen/i })
      );
      await user.click(screen.getByRole("button", { name: /close/i }));

      expect(screen.queryByTestId("image-viewer")).not.toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { ArtworkForm } from "./ArtworkForm";
import type { Id } from "../../../convex/_generated/dataModel";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useMutation: () => vi.fn().mockResolvedValue("mock-id"),
  useAction: () => vi.fn().mockResolvedValue(undefined),
  useQuery: () => undefined,
}));

// Mock auth
vi.mock("../../lib/auth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    token: "test-token",
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe("ArtworkForm", () => {
  beforeEach(() => {
    // Mock Image for thumbnail generation
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        private _src = "";
        get src() {
          return this._src;
        }
        set src(v: string) {
          this._src = v;
          setTimeout(() => this.onload?.(), 0);
        }
      }
    );

    // Mock canvas
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/jpeg;base64,test"
    );

    // Mock URL.createObjectURL
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("create mode", () => {
    it("renders add artwork title", () => {
      render(<ArtworkForm onClose={vi.fn()} />);
      expect(screen.getByText("Add Artwork")).toBeInTheDocument();
    });

    it("shows file input for images", () => {
      render(<ArtworkForm onClose={vi.fn()} />);
      expect(screen.getByTestId("file-input")).toBeInTheDocument();
    });

    it("shows drag and drop zone", () => {
      render(<ArtworkForm onClose={vi.fn()} />);
      expect(
        screen.getByText(/click or drag images here/i)
      ).toBeInTheDocument();
    });

    it("disables submit when no images selected", () => {
      render(<ArtworkForm onClose={vi.fn()} />);
      expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
    });

    it("renders metadata fields", () => {
      render(<ArtworkForm onClose={vi.fn()} />);
      // Labels without proper for attribute, check by text content
      expect(screen.getByText("Year")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
      expect(screen.getByText("Dimensions")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("renders published toggle", () => {
      render(<ArtworkForm onClose={vi.fn()} />);
      expect(screen.getByRole("checkbox", { name: /published/i })).toBeInTheDocument();
    });
  });

  describe("edit mode", () => {
    const mockArtwork = {
      _id: "artwork_1" as Id<"artworks">,
      title: "Existing Artwork",
      description: "Test description",
      year: 2023,
      medium: "Oil on canvas",
      dimensions: "24 x 36",
      published: true,
    };

    it("renders edit artwork title", () => {
      render(<ArtworkForm artwork={mockArtwork} onClose={vi.fn()} />);
      expect(screen.getByText("Edit Artwork")).toBeInTheDocument();
    });

    it("populates form with existing values", () => {
      render(<ArtworkForm artwork={mockArtwork} onClose={vi.fn()} />);
      expect(screen.getByDisplayValue("Existing Artwork")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test description")).toBeInTheDocument();
      expect(screen.getByDisplayValue("2023")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Oil on canvas")).toBeInTheDocument();
      expect(screen.getByDisplayValue("24 x 36")).toBeInTheDocument();
    });

    it("shows title input in edit mode", () => {
      render(<ArtworkForm artwork={mockArtwork} onClose={vi.fn()} />);
      expect(screen.getByText("Title *")).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockArtwork.title)).toBeInTheDocument();
    });

    it("enables submit without images in edit mode", () => {
      render(<ArtworkForm artwork={mockArtwork} onClose={vi.fn()} />);
      expect(screen.getByRole("button", { name: /save/i })).not.toBeDisabled();
    });
  });

  describe("form actions", () => {
    it("calls onClose when cancel clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ArtworkForm onClose={onClose} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe("validation", () => {
    const mockArtwork = {
      _id: "artwork_1" as Id<"artworks">,
      title: "Test",
      published: true,
    };

    it("requires title in edit mode", () => {
      render(<ArtworkForm artwork={mockArtwork} onClose={vi.fn()} />);
      const titleInput = screen.getByDisplayValue(mockArtwork.title);
      expect(titleInput).toHaveAttribute("required");
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { CollectionForm } from "./CollectionForm";
import type { Id } from "../../../convex/_generated/dataModel";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useMutation: () => vi.fn().mockResolvedValue("mock-id"),
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

describe("CollectionForm", () => {
  beforeEach(() => {
    // Mock URL APIs
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    });

    // Mock fetch for IconPicker
    global.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve(""),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("create mode", () => {
    it("renders add collection title", () => {
      render(<CollectionForm onClose={vi.fn()} />);
      expect(screen.getByText("Add Collection")).toBeInTheDocument();
    });

    it("renders name input", () => {
      render(<CollectionForm onClose={vi.fn()} />);
      expect(screen.getByText("Name *")).toBeInTheDocument();
    });

    it("renders slug input", () => {
      render(<CollectionForm onClose={vi.fn()} />);
      expect(screen.getByText("Slug *")).toBeInTheDocument();
    });

    it("renders description textarea", () => {
      render(<CollectionForm onClose={vi.fn()} />);
      expect(screen.getByText("Description")).toBeInTheDocument();
    });
  });

  describe("slug generation", () => {
    it("auto-generates slug from name in create mode", async () => {
      const user = userEvent.setup();
      render(<CollectionForm onClose={vi.fn()} />);

      const nameInput = screen.getByRole("textbox", { name: /name/i });
      await user.type(nameInput, "My New Collection");

      await waitFor(() => {
        expect(screen.getByDisplayValue("my-new-collection")).toBeInTheDocument();
      });
    });

    it("removes special characters from slug", async () => {
      const user = userEvent.setup();
      render(<CollectionForm onClose={vi.fn()} />);

      const nameInput = screen.getByRole("textbox", { name: /name/i });
      await user.type(nameInput, "Art & Design!");

      await waitFor(() => {
        expect(screen.getByDisplayValue("art--design")).toBeInTheDocument();
      });
    });
  });

  describe("edit mode", () => {
    const mockCollection = {
      _id: "collection_1" as Id<"collections">,
      name: "Paintings",
      description: "A collection of paintings",
      slug: "paintings",
    };

    it("renders edit collection title", () => {
      render(<CollectionForm collection={mockCollection} onClose={vi.fn()} />);
      expect(screen.getByText("Edit Collection")).toBeInTheDocument();
    });

    it("populates form with existing values", () => {
      render(<CollectionForm collection={mockCollection} onClose={vi.fn()} />);
      expect(screen.getByDisplayValue("Paintings")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("A collection of paintings")
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("paintings")).toBeInTheDocument();
    });

    it("does not auto-update slug when name changes in edit mode", async () => {
      const user = userEvent.setup();
      render(<CollectionForm collection={mockCollection} onClose={vi.fn()} />);

      const nameInput = screen.getByDisplayValue("Paintings");
      await user.clear(nameInput);
      await user.type(nameInput, "New Name");

      await waitFor(() => {
        // Slug should remain unchanged
        expect(screen.getByDisplayValue("paintings")).toBeInTheDocument();
      });
    });
  });

  describe("cover options", () => {
    it("renders upload zone for custom image", () => {
      render(<CollectionForm onClose={vi.fn()} />);
      expect(
        screen.getByText(/click or drag image here/i)
      ).toBeInTheDocument();
    });

    it("renders icon picker", () => {
      render(<CollectionForm onClose={vi.fn()} />);
      expect(
        screen.getByText(/or pick an icon/i)
      ).toBeInTheDocument();
    });
  });

  describe("form actions", () => {
    it("calls onClose when cancel clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<CollectionForm onClose={onClose} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("requires name field", () => {
      render(<CollectionForm onClose={vi.fn()} />);
      expect(screen.getByRole("textbox", { name: /name/i })).toHaveAttribute("required");
    });

    it("requires slug field", () => {
      render(<CollectionForm onClose={vi.fn()} />);
      expect(screen.getByRole("textbox", { name: /slug/i })).toHaveAttribute("required");
    });
  });

  describe("icon selection", () => {
    const mockCollectionWithIcon = {
      _id: "collection_1" as Id<"collections">,
      name: "Paintings",
      slug: "paintings",
      iconSvg: '<svg><path d="M0 0"/></svg>',
    };

    it("shows selected icon when provided", () => {
      render(
        <CollectionForm collection={mockCollectionWithIcon} onClose={vi.fn()} />
      );
      expect(screen.getByText("Selected icon")).toBeInTheDocument();
    });
  });
});

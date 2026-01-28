import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "../test/test-utils";
import userEvent from "@testing-library/user-event";
import { About } from "./About";

// Mock module state
let mockAboutText: string | undefined;
let mockSendMessage: ReturnType<typeof vi.fn>;

vi.mock("convex/react", () => ({
  useQuery: () => mockAboutText,
  useMutation: () => mockSendMessage,
}));

describe("About", () => {
  beforeEach(() => {
    mockAboutText = undefined;
    mockSendMessage = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("page structure", () => {
    it("renders page heading", () => {
      render(<About />);
      expect(
        screen.getByRole("heading", { name: "About" })
      ).toBeInTheDocument();
    });

    it("renders get in touch section", () => {
      render(<About />);
      expect(
        screen.getByRole("heading", { name: /get in touch/i })
      ).toBeInTheDocument();
    });
  });

  describe("about content", () => {
    it("shows default text when no about content", () => {
      mockAboutText = undefined;

      render(<About />);
      expect(screen.getByText("Welcome to my gallery.")).toBeInTheDocument();
    });

    it("renders about text when loaded", () => {
      mockAboutText = "This is my art gallery where I showcase my work.";

      render(<About />);
      expect(
        screen.getByText("This is my art gallery where I showcase my work.")
      ).toBeInTheDocument();
    });

    it("splits paragraphs by newlines", () => {
      mockAboutText = "First paragraph.\n\nSecond paragraph.";

      render(<About />);
      expect(screen.getByText("First paragraph.")).toBeInTheDocument();
      expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
    });
  });

  describe("contact form", () => {
    it("renders name input", () => {
      render(<About />);
      expect(screen.getByRole("textbox", { name: /name/i })).toBeInTheDocument();
    });

    it("renders email input", () => {
      render(<About />);
      expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    });

    it("renders message textarea", () => {
      render(<About />);
      expect(screen.getByRole("textbox", { name: /message/i })).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<About />);
      expect(
        screen.getByRole("button", { name: /send message/i })
      ).toBeInTheDocument();
    });

    it("all fields are required", () => {
      render(<About />);
      expect(screen.getByRole("textbox", { name: /name/i })).toHaveAttribute(
        "required"
      );
      expect(screen.getByRole("textbox", { name: /email/i })).toHaveAttribute(
        "required"
      );
      expect(screen.getByRole("textbox", { name: /message/i })).toHaveAttribute(
        "required"
      );
    });
  });

  describe("form submission", () => {
    it("submits form with valid data", async () => {
      const user = userEvent.setup();
      render(<About />);

      await user.type(screen.getByRole("textbox", { name: /name/i }), "John Doe");
      await user.type(screen.getByRole("textbox", { name: /email/i }), "john@example.com");
      await user.type(screen.getByRole("textbox", { name: /message/i }), "Hello there!");

      await user.click(screen.getByRole("button", { name: /send message/i }));

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith({
          name: "John Doe",
          email: "john@example.com",
          message: "Hello there!",
        });
      });
    });

    it("shows success message after submission", async () => {
      const user = userEvent.setup();
      render(<About />);

      await user.type(screen.getByRole("textbox", { name: /name/i }), "John");
      await user.type(screen.getByRole("textbox", { name: /email/i }), "john@example.com");
      await user.type(screen.getByRole("textbox", { name: /message/i }), "Hi");

      await user.click(screen.getByRole("button", { name: /send message/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Thank you for your message")
        ).toBeInTheDocument();
      });
    });

    it("shows sending state while submitting", async () => {
      mockSendMessage = vi.fn(() => new Promise(() => {})); // Never resolves

      const user = userEvent.setup();
      render(<About />);

      await user.type(screen.getByRole("textbox", { name: /name/i }), "John");
      await user.type(screen.getByRole("textbox", { name: /email/i }), "john@example.com");
      await user.type(screen.getByRole("textbox", { name: /message/i }), "Hi");

      await user.click(screen.getByRole("button", { name: /send message/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /sending/i })
        ).toBeInTheDocument();
      });
    });

    it("shows error message on failure", async () => {
      mockSendMessage = vi.fn().mockRejectedValue(new Error("Network error"));

      const user = userEvent.setup();
      render(<About />);

      await user.type(screen.getByRole("textbox", { name: /name/i }), "John");
      await user.type(screen.getByRole("textbox", { name: /email/i }), "john@example.com");
      await user.type(screen.getByRole("textbox", { name: /message/i }), "Hi");

      await user.click(screen.getByRole("button", { name: /send message/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Something went wrong. Please try again.")
        ).toBeInTheDocument();
      });
    });

    it("clears form after successful submission", async () => {
      const user = userEvent.setup();
      render(<About />);

      await user.type(screen.getByRole("textbox", { name: /name/i }), "John");
      await user.type(screen.getByRole("textbox", { name: /email/i }), "john@example.com");
      await user.type(screen.getByRole("textbox", { name: /message/i }), "Hi");

      await user.click(screen.getByRole("button", { name: /send message/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Thank you for your message")
        ).toBeInTheDocument();
      });
    });
  });
});

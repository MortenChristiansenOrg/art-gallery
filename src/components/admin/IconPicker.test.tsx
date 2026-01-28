import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { IconPicker } from "./IconPicker";

describe("IconPicker", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Mock fetch with default response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("renders search input when no value", () => {
      render(<IconPicker value={null} onChange={vi.fn()} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("shows label text", () => {
      render(<IconPicker value={null} onChange={vi.fn()} />);
      expect(
        screen.getByText(/Or pick an icon \(game-icons.net\)/i)
      ).toBeInTheDocument();
    });
  });

  describe("selected value", () => {
    it("shows selected icon when value provided", () => {
      const svg = '<svg><path d="M0 0"/></svg>';
      render(<IconPicker value={svg} onChange={vi.fn()} />);
      expect(screen.getByText("Selected icon")).toBeInTheDocument();
    });

    it("shows remove button when value selected", () => {
      const svg = '<svg><path d="M0 0"/></svg>';
      render(<IconPicker value={svg} onChange={vi.fn()} />);
      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
    });

    it("calls onChange with null when remove clicked", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onChange = vi.fn();
      const svg = '<svg><path d="M0 0"/></svg>';
      render(<IconPicker value={svg} onChange={onChange} />);

      await user.click(screen.getByRole("button", { name: /remove/i }));
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe("search", () => {
    it("debounces search input", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        text: () => Promise.resolve("icons/sword\nicons/shield\nicons/hammer"),
      });

      render(<IconPicker value={null} onChange={vi.fn()} />);

      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.type(input, "sw");

      // Results should not appear immediately
      expect(screen.queryByRole("button", { name: /sword/i })).not.toBeInTheDocument();

      // Advance debounce timer
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Wait for render after state update
      await waitFor(() => {
        expect(screen.queryByAltText("sword")).toBeInTheDocument();
      });
    });

    it("shows no results message when no matches", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        text: () => Promise.resolve("icons/sword\nicons/shield"),
      });

      render(<IconPicker value={null} onChange={vi.fn()} />);

      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.type(input, "zzzzz");

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText("No icons found")).toBeInTheDocument();
      });
    });

    it("requires minimum 2 characters to search", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        text: () => Promise.resolve("icons/sword"),
      });

      render(<IconPicker value={null} onChange={vi.fn()} />);

      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.type(input, "s");

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Should not show results grid with only 1 character
      expect(screen.queryByText("No icons found")).not.toBeInTheDocument();
    });
  });

  describe("icon selection", () => {
    it("fetches SVG and calls onChange on selection", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onChange = vi.fn();
      const mockSvg = '<svg viewBox="0 0 512 512"><path d="M0 0"/></svg>';

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          text: () => Promise.resolve("icons/sword"),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockSvg),
        });

      render(<IconPicker value={null} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.type(input, "sword");

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByAltText("sword")).toBeInTheDocument();
      });

      // Click on icon button
      const iconButton = screen.getByTitle("sword");
      await user.click(iconButton);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(mockSvg);
      });
    });
  });
});

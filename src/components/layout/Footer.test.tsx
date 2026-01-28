import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  describe("copyright year", () => {
    it("renders current year", () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear().toString();
      expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
    });

    it("updates year dynamically", () => {
      const mockDate = new Date(2030, 0, 1);
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      render(<Footer />);
      expect(screen.getByText(/2030/)).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe("branding", () => {
    it("renders Gallery text", () => {
      render(<Footer />);
      expect(screen.getByText("Gallery")).toBeInTheDocument();
    });
  });

  describe("structure", () => {
    it("renders as footer element", () => {
      render(<Footer />);
      expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    });

    it("contains copyright symbol", () => {
      render(<Footer />);
      const footer = screen.getByRole("contentinfo");
      expect(footer.textContent).toContain("\u00A9");
    });
  });
});

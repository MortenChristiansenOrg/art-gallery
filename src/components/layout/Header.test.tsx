import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Header } from "./Header";

const mockAuth = {
  isAuthenticated: false,
  token: null as string | null,
  login: vi.fn(),
  logout: vi.fn(),
};

vi.mock("../../lib/auth", () => ({
  useAuth: () => mockAuth,
}));

beforeEach(() => {
  mockAuth.isAuthenticated = false;
  mockAuth.token = null;
});

function renderHeader(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Header />
    </MemoryRouter>
  );
}

describe("Header", () => {
  describe("navigation links", () => {
    it("renders Gallery logo link", () => {
      renderHeader();
      expect(
        screen.getByRole("link", { name: /gallery/i })
      ).toBeInTheDocument();
    });

    it("renders Works link", () => {
      renderHeader();
      expect(screen.getByRole("link", { name: /works/i })).toBeInTheDocument();
    });

    it("renders About link", () => {
      renderHeader();
      expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
    });

    it("Gallery logo links to home", () => {
      renderHeader();
      const logoLink = screen.getByRole("link", { name: /gallery/i });
      expect(logoLink).toHaveAttribute("href", "/");
    });

    it("Works link points to home", () => {
      renderHeader();
      const worksLink = screen.getByRole("link", { name: /works/i });
      expect(worksLink).toHaveAttribute("href", "/");
    });

    it("About link points to about page", () => {
      renderHeader();
      const aboutLink = screen.getByRole("link", { name: /about/i });
      expect(aboutLink).toHaveAttribute("href", "/about");
    });
  });

  describe("active state styling", () => {
    it("Works link is active on home route", () => {
      renderHeader("/");
      const worksLink = screen.getByRole("link", { name: /works/i });
      expect(worksLink).toHaveClass("text-[var(--color-gallery-text)]");
    });

    it("About link is not active on home route", () => {
      renderHeader("/");
      const aboutLink = screen.getByRole("link", { name: /about/i });
      expect(aboutLink).toHaveClass("text-[var(--color-gallery-muted)]");
    });

    it("About link is active on about route", () => {
      renderHeader("/about");
      const aboutLink = screen.getByRole("link", { name: /about/i });
      expect(aboutLink).toHaveClass("text-[var(--color-gallery-text)]");
    });

    it("Works link is not active on about route", () => {
      renderHeader("/about");
      const worksLink = screen.getByRole("link", { name: /works/i });
      expect(worksLink).toHaveClass("text-[var(--color-gallery-muted)]");
    });
  });

  describe("structure", () => {
    it("renders as header element", () => {
      renderHeader();
      expect(screen.getByRole("banner")).toBeInTheDocument();
    });

    it("renders navigation element", () => {
      renderHeader();
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("renders navigation list", () => {
      renderHeader();
      expect(screen.getByRole("list")).toBeInTheDocument();
    });

    it("renders two nav items", () => {
      renderHeader();
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
    });
  });

  describe("authenticated state", () => {
    beforeEach(() => {
      mockAuth.isAuthenticated = true;
      mockAuth.token = "test-token";
    });

    it("renders Admin link when authenticated", () => {
      renderHeader();
      expect(screen.getByRole("link", { name: /admin/i })).toBeInTheDocument();
    });

    it("Admin link points to /admin", () => {
      renderHeader();
      expect(screen.getByRole("link", { name: /admin/i })).toHaveAttribute(
        "href",
        "/admin"
      );
    });

    it("renders three nav items when authenticated", () => {
      renderHeader();
      expect(screen.getAllByRole("listitem")).toHaveLength(3);
    });

    it("does not render Admin link when not authenticated", () => {
      mockAuth.isAuthenticated = false;
      renderHeader();
      expect(
        screen.queryByRole("link", { name: /admin/i })
      ).not.toBeInTheDocument();
    });
  });
});

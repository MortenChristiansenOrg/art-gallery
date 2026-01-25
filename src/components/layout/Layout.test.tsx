import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./Layout";

function renderLayout(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<div>Home Content</div>} />
          <Route path="/about" element={<div>About Content</div>} />
          <Route path="/test" element={<div>Test Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("Layout", () => {
  describe("structure", () => {
    it("renders header", () => {
      renderLayout();
      expect(screen.getByRole("banner")).toBeInTheDocument();
    });

    it("renders footer", () => {
      renderLayout();
      expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    });

    it("renders main content area", () => {
      renderLayout();
      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("renders outlet content", () => {
      renderLayout("/");
      expect(screen.getByText("Home Content")).toBeInTheDocument();
    });
  });

  describe("header navigation", () => {
    it("renders Works link", () => {
      renderLayout();
      expect(screen.getByRole("link", { name: /works/i })).toBeInTheDocument();
    });

    it("renders About link", () => {
      renderLayout();
      expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
    });

    it("renders Gallery logo link", () => {
      renderLayout();
      expect(
        screen.getByRole("link", { name: /gallery/i })
      ).toBeInTheDocument();
    });
  });

  describe("footer", () => {
    it("renders copyright year", () => {
      renderLayout();
      const currentYear = new Date().getFullYear().toString();
      expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
    });

    it("renders Gallery text", () => {
      renderLayout();
      expect(screen.getAllByText(/gallery/i).length).toBeGreaterThan(0);
    });
  });

  describe("route rendering", () => {
    it("renders home route content", () => {
      renderLayout("/");
      expect(screen.getByText("Home Content")).toBeInTheDocument();
    });

    it("renders about route content", () => {
      renderLayout("/about");
      expect(screen.getByText("About Content")).toBeInTheDocument();
    });

    it("renders custom route content", () => {
      renderLayout("/test");
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });
  });
});

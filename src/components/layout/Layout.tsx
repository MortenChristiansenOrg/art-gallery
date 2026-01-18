import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-gallery-bg)]">
      <Header />
      {/* pt-[calc(5rem+2px)] accounts for header height (h-20 = 5rem) plus borders */}
      <main className="flex-1 pt-[calc(5rem+2px)]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

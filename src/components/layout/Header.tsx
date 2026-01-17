import { Link, useLocation } from "react-router-dom";

const navItems = [
  { path: "/", label: "Gallery" },
  { path: "/about", label: "About" },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-gallery-bg)]/95 backdrop-blur-sm">
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          to="/"
          className="font-[var(--font-serif)] text-2xl tracking-wide hover:opacity-70 transition-opacity"
        >
          Gallery
        </Link>

        <ul className="flex items-center gap-8">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`text-sm tracking-wide uppercase transition-opacity hover:opacity-70 ${
                  location.pathname === item.path
                    ? "opacity-100"
                    : "opacity-60"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

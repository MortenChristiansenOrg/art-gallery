import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth";

const navItems = [
  { path: "/", label: "Works" },
  { path: "/about", label: "About" },
];

export function Header() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-gallery-bg)]/90 backdrop-blur-md">
      {/* Top accent line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--color-gallery-border)] to-transparent" />

      <nav className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="group relative"
          >
            <span className="font-[var(--font-serif)] text-[1.75rem] font-light tracking-[0.02em] text-[var(--color-gallery-text)]">
              Gallery
            </span>
            <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-[var(--color-gallery-text)] origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" />
          </Link>

          {/* Navigation */}
          <ul className="flex items-center gap-10">
            {navItems.map((item) => {
              const isActive = item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      relative text-[0.8rem] tracking-[0.15em] uppercase font-light
                      transition-colors duration-300
                      ${isActive
                        ? "text-[var(--color-gallery-text)]"
                        : "text-[var(--color-gallery-muted)] hover:text-[var(--color-gallery-text)]"
                      }
                    `}
                  >
                    {item.label}
                    {/* Active indicator */}
                    <span
                      className={`
                        absolute -bottom-1 left-0 w-full h-[1px]
                        bg-[var(--color-gallery-text)]
                        transition-transform duration-300 origin-left
                        ${isActive ? "scale-x-100" : "scale-x-0"}
                      `}
                    />
                  </Link>
                </li>
              );
            })}
            {isAuthenticated && (
              <li>
                <Link
                  to="/admin"
                  className="relative text-[0.8rem] tracking-[0.15em] uppercase font-light transition-colors duration-300 text-[var(--color-gallery-muted)] hover:text-[var(--color-gallery-text)]"
                >
                  Admin
                </Link>
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/* Bottom border */}
      <div className="h-[1px] bg-[var(--color-gallery-border-light)]" />
    </header>
  );
}

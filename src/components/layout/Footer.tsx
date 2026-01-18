export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      {/* Top border with gradient fade */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--color-gallery-border-light)] to-transparent" />

      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p
            className="
              text-[0.7rem] tracking-[0.15em] uppercase
              text-[var(--color-gallery-subtle)]
              font-light
            "
          >
            &copy; {year}
          </p>

          {/* Decorative element */}
          <div className="flex items-center gap-4">
            <span className="w-8 h-[1px] bg-[var(--color-gallery-border)]" />
            <span
              className="
                text-[0.65rem] tracking-[0.2em] uppercase
                text-[var(--color-gallery-subtle)]
                font-light
              "
            >
              Gallery
            </span>
            <span className="w-8 h-[1px] bg-[var(--color-gallery-border)]" />
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-gallery-border)] mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-sm text-[var(--color-gallery-muted)] text-center">
          &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}

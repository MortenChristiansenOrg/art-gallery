import { render, type RenderOptions } from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import type { ReactElement, ReactNode } from "react";

interface WrapperProps {
  children: ReactNode;
}

// Basic wrapper with BrowserRouter
function BrowserWrapper({ children }: WrapperProps) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

// Memory router wrapper for testing specific routes
interface MemoryRouterWrapperOptions {
  initialEntries?: string[];
}

function createMemoryWrapper(options: MemoryRouterWrapperOptions = {}) {
  return function MemoryWrapper({ children }: WrapperProps) {
    return (
      <MemoryRouter initialEntries={options.initialEntries || ["/"]}>
        {children}
      </MemoryRouter>
    );
  };
}

// Custom render with router
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: BrowserWrapper, ...options });
}

// Render with specific route
function renderWithRoute(
  ui: ReactElement,
  initialEntries: string[],
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, {
    wrapper: createMemoryWrapper({ initialEntries }),
    ...options,
  });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

// Export custom renders
export { customRender as render, renderWithRoute };

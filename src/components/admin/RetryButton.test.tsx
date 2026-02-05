import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { RetryButton } from "./RetryButton";

describe("RetryButton", () => {
  it("renders with 'Retry' text", () => {
    render(<RetryButton onRetry={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("calls onRetry when clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn().mockResolvedValue(undefined);

    render(<RetryButton onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("disables button and shows 'Retrying...' during action", async () => {
    const user = userEvent.setup();

    let resolveAction: () => void;
    const onRetry = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        })
    );

    render(<RetryButton onRetry={onRetry} />);

    const button = screen.getByRole("button", { name: "Retry" });
    await user.click(button);

    // Button should now show "Retrying..." and be disabled
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Retrying..." })).toBeDisabled();
    });

    // Resolve the action
    resolveAction!();

    // Button should return to normal
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Retry" })).not.toBeDisabled();
    });
  });

  it("prevents multiple clicks while retrying (idempotency)", async () => {
    const user = userEvent.setup();

    const onRetry = vi.fn().mockImplementation(
      () => new Promise<void>(() => {}) // Never resolves
    );

    render(<RetryButton onRetry={onRetry} />);

    const button = screen.getByRole("button", { name: "Retry" });

    // Click once
    await user.click(button);

    // Wait for button to become disabled
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Retrying..." })).toBeDisabled();
    });

    // Try clicking again - should be ignored since disabled
    await user.click(screen.getByRole("button", { name: "Retrying..." }));

    // Action should only be called once
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("re-enables button after action fails", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const onRetry = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<RetryButton onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: "Retry" }));

    // Button should return to normal after failure
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Retry" })).not.toBeDisabled();
    });

    consoleError.mockRestore();
  });

  it("respects disabled prop", () => {
    render(<RetryButton onRetry={vi.fn()} disabled />);
    expect(screen.getByRole("button", { name: "Retry" })).toBeDisabled();
  });

  it("does not call onRetry when disabled", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<RetryButton onRetry={onRetry} disabled />);
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(onRetry).not.toHaveBeenCalled();
  });
});

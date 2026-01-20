import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../auth";

// Mock convex/react hooks
const mockLoginMutation = vi.fn();
const mockValidateSession = { valid: true };

vi.mock("convex/react", () => ({
  useMutation: () => mockLoginMutation,
  useQuery: (_api: unknown, args: unknown) => {
    if (args === "skip") return undefined;
    return mockValidateSession;
  },
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    auth: {
      login: "auth:login",
      validateSession: "auth:validateSession",
    },
  },
}));

// Test component that uses auth context
function TestConsumer() {
  const { isAuthenticated, token, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? "yes" : "no"}</span>
      <span data-testid="token">{token ?? "none"}</span>
      <button onClick={() => login("test-password")}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("initializes as unauthenticated", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("no");
    expect(screen.getByTestId("token")).toHaveTextContent("none");
  });

  it("restores token from sessionStorage", () => {
    sessionStorage.setItem("gallery_admin_token", "saved-token");

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("yes");
    expect(screen.getByTestId("token")).toHaveTextContent("saved-token");
  });

  it("login returns true and stores token on success", async () => {
    mockLoginMutation.mockResolvedValueOnce({
      success: true,
      token: "new-token",
      error: null,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("yes");
      expect(screen.getByTestId("token")).toHaveTextContent("new-token");
    });

    expect(sessionStorage.getItem("gallery_admin_token")).toBe("new-token");
    expect(mockLoginMutation).toHaveBeenCalledWith({ password: "test-password" });
  });

  it("login returns false on invalid password", async () => {
    mockLoginMutation.mockResolvedValueOnce({
      success: false,
      token: null,
      error: "Invalid password",
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("no");
    });
  });

  it("login handles server error when ADMIN_PASSWORD not configured", async () => {
    // This simulates the server throwing when ADMIN_PASSWORD env var is missing
    mockLoginMutation.mockRejectedValueOnce(new Error("ADMIN_PASSWORD not set"));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("no");
    });
  });

  it("logout clears token and sessionStorage", async () => {
    sessionStorage.setItem("gallery_admin_token", "existing-token");

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("yes");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(screen.getByTestId("auth-status")).toHaveTextContent("no");
    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(sessionStorage.getItem("gallery_admin_token")).toBeNull();
  });
});

describe("useAuth hook", () => {
  it("throws error when used outside AuthProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow("useAuth must be used within AuthProvider");

    consoleError.mockRestore();
  });
});

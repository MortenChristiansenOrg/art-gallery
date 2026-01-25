import { vi } from "vitest";

export interface MockAuthContext {
  isAuthenticated: boolean;
  token: string | null;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
}

export function createMockAuthContext(
  overrides: Partial<MockAuthContext> = {}
): MockAuthContext {
  return {
    isAuthenticated: false,
    token: null,
    login: vi.fn().mockResolvedValue(true),
    logout: vi.fn(),
    ...overrides,
  };
}

export function createAuthenticatedContext(): MockAuthContext {
  return createMockAuthContext({
    isAuthenticated: true,
    token: "test-token",
  });
}

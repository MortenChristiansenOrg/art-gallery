import { vi } from "vitest";

type QueryResult<T> = T | undefined;
type MutationResult<T> = T | undefined;

// Mock for useQuery hook
export function mockConvexQuery<T>(result: QueryResult<T>) {
  return vi.fn().mockReturnValue(result);
}

// Mock for useMutation hook
export function mockConvexMutation<T>(result: MutationResult<T> = undefined) {
  const mutate = vi.fn().mockResolvedValue(result);
  return mutate;
}

// Setup query mock helper
export function setupQueryMock<T>(
  mockFn: ReturnType<typeof vi.fn>,
  result: T
): void {
  mockFn.mockReturnValue(result);
}

// Setup mutation mock helper
export function setupMutationMock<T>(
  mockFn: ReturnType<typeof vi.fn>,
  result: T
): void {
  mockFn.mockResolvedValue(result);
}

// Create a mock Convex client for testing
export function createMockConvexClient() {
  return {
    query: vi.fn(),
    mutation: vi.fn(),
    action: vi.fn(),
  };
}

// Helper to mock useQuery loading state
export function mockLoadingQuery() {
  return undefined;
}

// Helper for mock storage URLs
export function createMockStorageUrl(storageId: string): string {
  return `https://example.com/storage/${storageId}`;
}

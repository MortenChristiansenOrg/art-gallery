import { deriveHash } from "../auth";

/** Generate a valid auth token for tests. Requires ADMIN_PASSWORD env to be stubbed. */
export async function generateTestToken(): Promise<string> {
  const timestamp = Date.now();
  const hash = await deriveHash(String(timestamp));
  return btoa(`${timestamp}:${hash}`);
}

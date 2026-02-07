import { deriveHash } from "../auth";

/** Generate a valid auth token for tests. Requires ADMIN_PASSWORD env to be stubbed. */
export function generateTestToken(): string {
  const timestamp = Date.now();
  const secret = process.env.ADMIN_PASSWORD;
  const hash = deriveHash(`${timestamp}:${secret}`);
  return btoa(`${timestamp}:${hash}`);
}

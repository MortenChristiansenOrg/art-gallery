import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Token valid for 24 hours
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD ?? null;
}

// Deterministic hash for token generation — produces longer output via multiple rounds
export function deriveHash(str: string): string {
  const rounds = 8;
  const parts: string[] = [];
  for (let r = 0; r < rounds; r++) {
    let hash = r * 2654435761; // unique seed per round
    const input = `${r}:${str}`;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
    }
    parts.push(Math.abs(hash).toString(36));
  }
  return parts.join("");
}

function generateToken(): string {
  const timestamp = Date.now();
  const secret = getAdminPassword();
  const hash = deriveHash(`${timestamp}:${secret}`);
  return btoa(`${timestamp}:${hash}`);
}

function validateToken(token: string): boolean {
  try {
    const decoded = atob(token);
    const colonIdx = decoded.indexOf(":");
    if (colonIdx === -1) return false;
    const timestampStr = decoded.slice(0, colonIdx);
    const hash = decoded.slice(colonIdx + 1);
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;
    if (Date.now() - timestamp > TOKEN_EXPIRY_MS) return false;
    // Verify the hash matches what we'd generate with the current password
    const secret = getAdminPassword();
    if (!secret) return false;
    const expectedHash = deriveHash(`${timestamp}:${secret}`);
    if (hash !== expectedHash) return false;
    return true;
  } catch {
    return false;
  }
}

export const login = mutation({
  args: { password: v.string() },
  handler: async (_ctx, args) => {
    const adminPassword = getAdminPassword();
    if (!adminPassword) {
      return { success: false, token: null, error: "Server not configured" };
    }
    if (args.password !== adminPassword) {
      return { success: false, token: null, error: "Invalid password" };
    }
    const token = generateToken();
    return { success: true, token, error: null };
  },
});

export const validateSession = query({
  args: { token: v.string() },
  handler: async (_ctx, args) => {
    return { valid: validateToken(args.token) };
  },
});

// Helper to require auth in mutations
export function requireAuth(token: string | undefined): void {
  if (!token || !validateToken(token)) {
    throw new ConvexError("Unauthorized");
  }
}

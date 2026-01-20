import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Token valid for 24 hours
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD ?? null;
}

// Simple hash for token generation
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function generateToken(): string {
  const timestamp = Date.now();
  const secret = getAdminPassword();
  const hash = simpleHash(`${timestamp}:${secret}:${Math.random()}`);
  return btoa(`${timestamp}:${hash}`);
}

function validateToken(token: string): boolean {
  try {
    const decoded = atob(token);
    const [timestampStr] = decoded.split(":");
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;
    if (Date.now() - timestamp > TOKEN_EXPIRY_MS) return false;
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
    throw new Error("Unauthorized");
  }
}

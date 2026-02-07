import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Token valid for 24 hours
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD ?? null;
}

// HMAC-SHA256 hash for token generation
export async function deriveHash(str: string): Promise<string> {
  const secret = getAdminPassword();
  if (!secret) throw new Error("Admin password not configured");
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(str));
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function generateToken(): Promise<string> {
  const timestamp = Date.now();
  const hash = await deriveHash(String(timestamp));
  return btoa(`${timestamp}:${hash}`);
}

async function validateToken(token: string): Promise<boolean> {
  try {
    const decoded = atob(token);
    const colonIdx = decoded.indexOf(":");
    if (colonIdx === -1) return false;
    const timestampStr = decoded.slice(0, colonIdx);
    const hash = decoded.slice(colonIdx + 1);
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;
    if (Date.now() - timestamp > TOKEN_EXPIRY_MS) return false;
    const secret = getAdminPassword();
    if (!secret) return false;
    const expectedHash = await deriveHash(String(timestamp));
    if (!constantTimeEqual(hash, expectedHash)) return false;
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
    const token = await generateToken();
    return { success: true, token, error: null };
  },
});

export const validateSession = query({
  args: { token: v.string() },
  handler: async (_ctx, args) => {
    return { valid: await validateToken(args.token) };
  },
});

// Helper to require auth in mutations
export async function requireAuth(
  token: string | undefined
): Promise<void> {
  if (!token || !(await validateToken(token))) {
    throw new ConvexError("Unauthorized");
  }
}

import { describe, it, expect, beforeEach, vi } from "vitest";
import { api } from "../_generated/api";
import { createTestContext } from "./setup";

describe("auth", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", "test-password");
  });

  describe("login", () => {
    it("returns success with valid password", async () => {
      const t = createTestContext();

      const result = await t.mutation(api.auth.login, {
        password: "test-password",
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.error).toBeNull();
    });

    it("returns failure with invalid password", async () => {
      const t = createTestContext();

      const result = await t.mutation(api.auth.login, {
        password: "wrong-password",
      });

      expect(result.success).toBe(false);
      expect(result.token).toBeNull();
      expect(result.error).toBe("Invalid password");
    });

    it("returns failure when server not configured", async () => {
      vi.stubEnv("ADMIN_PASSWORD", "");
      const t = createTestContext();

      const result = await t.mutation(api.auth.login, {
        password: "any",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Server not configured");
    });
  });

  describe("validateSession", () => {
    it("returns valid for fresh token", async () => {
      const t = createTestContext();

      // Login to get a token
      const loginResult = await t.mutation(api.auth.login, {
        password: "test-password",
      });

      const result = await t.query(api.auth.validateSession, {
        token: loginResult.token!,
      });

      expect(result.valid).toBe(true);
    });

    it("returns invalid for malformed token", async () => {
      const t = createTestContext();

      const result = await t.query(api.auth.validateSession, {
        token: "malformed-token",
      });

      expect(result.valid).toBe(false);
    });

    it("returns invalid for expired token", async () => {
      const t = createTestContext();

      // Create a token with old timestamp (more than 24 hours ago)
      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000;
      const expiredToken = btoa(`${oldTimestamp}:somehash`);

      const result = await t.query(api.auth.validateSession, {
        token: expiredToken,
      });

      expect(result.valid).toBe(false);
    });
  });
});

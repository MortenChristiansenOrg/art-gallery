import { describe, it, expect, beforeEach, vi } from "vitest";
import { api } from "../_generated/api";
import { createTestContext } from "./setup";
import { generateTestToken } from "./testHelpers";

describe("files", () => {
  let validToken: string;

  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", "test-password");
    validToken = generateTestToken();
  });

  describe("generateUploadUrl", () => {
    it("throws without valid token", async () => {
      const t = createTestContext();

      await expect(
        t.mutation(api.files.generateUploadUrl, {
          token: "invalid",
        })
      ).rejects.toThrow();
    });

    it("returns upload URL with valid token", async () => {
      const t = createTestContext();

      const url = await t.mutation(api.files.generateUploadUrl, {
        token: validToken,
      });

      expect(url).toBeDefined();
      expect(typeof url).toBe("string");
    });
  });
});

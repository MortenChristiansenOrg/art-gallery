import { describe, it, expect, beforeEach, vi } from "vitest";
import { api } from "../_generated/api";
import { createTestContext } from "./setup";

describe("files", () => {
  const validToken = btoa(`${Date.now()}:validhash`);

  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", "test-password");
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

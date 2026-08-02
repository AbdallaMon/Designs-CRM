import { describe, it, expect } from "vitest";
import { isAdminTier } from "../user.dto.js";

describe("isAdminTier follows the current-profile flag", () => {
  it("honors the active profile admin-tier flag", () => {
    expect(isAdminTier({ isAdminTier: true })).toBe(true);
  });

  it("honors an explicit non-admin active profile", () => {
    expect(isAdminTier({ isAdminTier: false })).toBe(false);
  });

  it("does not infer admin access when the active profile flag is missing", () => {
    expect(isAdminTier({ currentProfileKey: "ADMIN" })).toBe(false);
  });
});

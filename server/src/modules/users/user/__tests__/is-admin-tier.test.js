import { describe, it, expect } from "vitest";
import { isAdminTier } from "../user.dto.js";

describe("isAdminTier follows the current-profile flag", () => {
  it("honors an explicit isAdminTier=true even for a non-admin role", () => {
    expect(isAdminTier({ isAdminTier: true, role: "STAFF" })).toBe(true);
  });

  it("honors isAdminTier=false even for an ADMIN role (switched to a non-admin profile)", () => {
    expect(isAdminTier({ isAdminTier: false, role: "ADMIN", isSuperSales: true })).toBe(false);
  });

  it("falls back to the legacy role/flags/subRoles union when no flag is present", () => {
    expect(isAdminTier({ role: "ADMIN" })).toBe(true);
    expect(isAdminTier({ role: "STAFF" })).toBe(false);
    expect(isAdminTier({ role: "STAFF", isSuperSales: true })).toBe(true);
    expect(isAdminTier({ role: "STAFF", subRoles: [{ subRole: "ADMIN" }] })).toBe(true);
  });
});

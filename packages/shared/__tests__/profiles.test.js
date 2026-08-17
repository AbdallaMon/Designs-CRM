import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  getEffectivePermissions,
  PROFILE_KEYS,
  PROFILE_META,
  PROFILE_PERMISSION_DEFAULTS,
  PROFILES,
  PERMISSIONS,
  resolveProfileKey,
} from "../index.js";

describe("active profiles", () => {
  it("defines metadata and real permission codes for every profile", () => {
    const permissionUniverse = new Set(ALL_PERMISSIONS);
    for (const key of PROFILE_KEYS) {
      expect(PROFILE_META[key]).toBeTruthy();
      expect(PROFILE_META[key].label).toBeTruthy();
      expect(PROFILE_META[key].family).toBeTruthy();
      for (const code of PROFILE_PERMISSION_DEFAULTS[key]) {
        expect(permissionUniverse.has(code)).toBe(true);
      }
    }
  });

  it("models the sales profiles as an increasing hierarchy", () => {
    const primary = new Set(PROFILE_PERMISSION_DEFAULTS[PROFILES.PRIMARY_SALES]);
    const superSales = new Set(PROFILE_PERMISSION_DEFAULTS[PROFILES.SUPER_SALES]);
    expect(
      PROFILE_PERMISSION_DEFAULTS[PROFILES.NORMAL_SALES].every((code) =>
        primary.has(code),
      ),
    ).toBe(true);
    expect(
      PROFILE_PERMISSION_DEFAULTS[PROFILES.PRIMARY_SALES].every((code) =>
        superSales.has(code),
      ),
    ).toBe(true);
  });

  it("resolves only an explicit valid active profile", () => {
    expect(resolveProfileKey({ profile: "PRIMARY_SALES" })).toBe("PRIMARY_SALES");
    expect(resolveProfileKey({ currentProfileKey: "ADMIN" })).toBe("ADMIN");
    expect(resolveProfileKey({ currentProfile: { key: "ACCOUNTANT" } })).toBe(
      "ACCOUNTANT",
    );
    expect(resolveProfileKey({ role: "ADMIN" })).toBeNull();
    expect(resolveProfileKey({ profile: "UNKNOWN", role: "ADMIN" })).toBeNull();
  });

  it("ignores retained role, sub-role, and sales-flag fields", () => {
    const base = getEffectivePermissions({ profile: "NORMAL_SALES" }).permissions;
    const withRetainedFields = getEffectivePermissions({
      profile: "NORMAL_SALES",
      role: "ADMIN",
      subRoles: ["SUPER_ADMIN"],
      isPrimary: true,
      isSuperSales: true,
    }).permissions;
    expect(withRetainedFields).toEqual(base);
  });

  it("grants lead-pool visibility through explicit permission codes", () => {
    const has = (profile, code) => PROFILE_PERMISSION_DEFAULTS[profile].includes(code);

    expect(has("CONTACT_INITIATOR", PERMISSIONS.LEAD.NON_CONSULTED_VIEW)).toBe(true);
    expect(has("CONTACT_INITIATOR", PERMISSIONS.LEAD.ON_HOLD_VIEW)).toBe(false);
    expect(has("NORMAL_SALES", PERMISSIONS.LEAD.NON_CONSULTED_VIEW)).toBe(false);
    expect(has("NORMAL_SALES", PERMISSIONS.LEAD.ON_HOLD_VIEW)).toBe(true);
    expect(has("SUPER_SALES", PERMISSIONS.LEAD.NON_CONSULTED_VIEW)).toBe(true);
    expect(has("SUPER_SALES", PERMISSIONS.LEAD.ON_HOLD_VIEW)).toBe(true);
    expect(has("ADMIN", PERMISSIONS.LEAD.NON_CONSULTED_VIEW)).toBe(true);
    expect(has("ADMIN", PERMISSIONS.LEAD.ON_HOLD_VIEW)).toBe(true);
  });
});

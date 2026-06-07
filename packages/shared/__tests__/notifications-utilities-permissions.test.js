import { describe, it, expect } from "vitest";
import {
  getEffectivePermissions,
  getPermissionsForRole,
  PERMISSIONS,
  USER_ROLES,
  ALL_USER_ROLES,
  ALL_PERMISSIONS,
  UTILITY_MODEL_ALLOWLIST,
  UTILITY_MODEL_PROJECTIONS,
} from "../index.js";

const P = PERMISSIONS;

// notification + utility code sets. Legacy gates: `/shared/utilities/*` = SHARED gate (all
// 9 authed roles); `/utility/notification/*` = UNAUTHENTICATED (now authed, granted to all
// authed roles since every user owns notifications); `/utility/search` = any logged-in user.
// So every authed role gets the full set.
const NOTIFICATION_ALL = Object.values(P.NOTIFICATION);
const UTILITY_ALL = Object.values(P.UTILITY);

describe("notifications + utilities permission grants", () => {
  it("registers NOTIFICATION + UTILITY in the aggregate + ALL_PERMISSIONS", () => {
    expect(Object.keys(P.NOTIFICATION).length).toBeGreaterThan(0);
    expect(Object.keys(P.UTILITY).length).toBeGreaterThan(0);
    for (const code of [...NOTIFICATION_ALL, ...UTILITY_ALL]) {
      expect(typeof code).toBe("string");
      expect(ALL_PERMISSIONS).toContain(code);
    }
  });

  it("grants the full notification + utility surface to EVERY authed role (legacy SHARED/any-authed)", () => {
    for (const role of ALL_USER_ROLES) {
      const codes = getPermissionsForRole(role);
      for (const code of [...NOTIFICATION_ALL, ...UTILITY_ALL]) {
        expect(codes).toContain(code);
      }
    }
  });

  it("an authed user holds notification.list/mark_read + utility.search via effective permissions", () => {
    const eff = getEffectivePermissions({ role: USER_ROLES.STAFF }).permissions;
    expect(eff).toContain(P.NOTIFICATION.LIST);
    expect(eff).toContain(P.NOTIFICATION.MARK_READ);
    expect(eff).toContain(P.UTILITY.SEARCH);
    expect(eff).toContain(P.UTILITY.MODEL_READ);
  });

  it("the generic-model allow-list is a non-empty frozen list of REAL Prisma delegates excluding sensitive tables", () => {
    expect(Array.isArray(UTILITY_MODEL_ALLOWLIST)).toBe(true);
    expect(UTILITY_MODEL_ALLOWLIST.length).toBeGreaterThan(0);
    expect(Object.isFrozen(UTILITY_MODEL_ALLOWLIST)).toBe(true);
    expect(UTILITY_MODEL_ALLOWLIST).not.toContain("user");
    expect(UTILITY_MODEL_ALLOWLIST).not.toContain("clientLead");
    expect(UTILITY_MODEL_ALLOWLIST).not.toContain("clientImageSession");
    // FIX 3: real delegate names only (the bogus image/pattern/color/imageSession are gone).
    expect(UTILITY_MODEL_ALLOWLIST).toContain("designImage");
    expect(UTILITY_MODEL_ALLOWLIST).toContain("colorPattern");
    expect(UTILITY_MODEL_ALLOWLIST).not.toContain("image");
    expect(UTILITY_MODEL_ALLOWLIST).not.toContain("imageSession");
  });

  it("every allow-listed model has a fixed pick-list projection (id + label), no relation include", () => {
    for (const model of UTILITY_MODEL_ALLOWLIST) {
      const select = UTILITY_MODEL_PROJECTIONS[model];
      expect(select, `projection for ${model}`).toBeTruthy();
      expect(select.id).toBe(true);
      expect(select.include).toBeUndefined();
    }
  });
});

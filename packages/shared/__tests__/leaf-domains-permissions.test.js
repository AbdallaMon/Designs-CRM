import { describe, it, expect } from "vitest";
import {
  getEffectivePermissions,
  getPermissionsForRole,
  PERMISSIONS,
  USER_ROLES,
  ALL_USER_ROLES,
  ALL_PERMISSIONS,
} from "../index.js";

const P = PERMISSIONS;

// All three leaf domains were behind the legacy SHARED router gate
// (verifyTokenAndHandleAuthorization(..., "SHARED")) — i.e. every one of the 9 authed
// roles could reach every route. The codes must therefore be granted to EVERY base role.
const QUESTION_ALL = Object.values(P.QUESTION);
const SALES_STAGE_ALL = Object.values(P.SALES_STAGE);
const REVIEW_ALL = Object.values(P.REVIEW);
const LEAF_ALL = [...QUESTION_ALL, ...SALES_STAGE_ALL, ...REVIEW_ALL];

describe("leaf-domains permission registration", () => {
  it("registers QUESTION / SALES_STAGE / REVIEW in the aggregate + ALL_PERMISSIONS", () => {
    expect(QUESTION_ALL.length).toBeGreaterThan(0);
    expect(SALES_STAGE_ALL.length).toBeGreaterThan(0);
    expect(REVIEW_ALL.length).toBeGreaterThan(0);
    for (const code of LEAF_ALL) {
      expect(typeof code).toBe("string");
      expect(ALL_PERMISSIONS).toContain(code);
    }
  });

  it("has no duplicate codes across the three leaf domains", () => {
    const set = new Set(LEAF_ALL);
    expect(set.size).toBe(LEAF_ALL.length);
  });
});

describe("leaf-domains role parity (SHARED gate = all 9 authed roles)", () => {
  it("grants every leaf code to ALL 9 authed roles", () => {
    expect(ALL_USER_ROLES.length).toBe(9);
    for (const role of ALL_USER_ROLES) {
      const codes = getPermissionsForRole(role);
      for (const code of LEAF_ALL) {
        expect(codes, `${role} should hold ${code}`).toContain(code);
      }
    }
  });

  it("grants the leaf codes via the base role alone (no isSuperSales needed)", () => {
    // A scoped role with NO isSuperSales flag still holds every leaf code (the legacy
    // SHARED gate did not depend on isSuperSales).
    const staff = getEffectivePermissions({
      role: USER_ROLES.STAFF,
      isSuperSales: false,
    }).permissions;
    for (const code of LEAF_ALL) {
      expect(staff).toContain(code);
    }
  });

  it("does not WIDEN — leaf codes are not admin-tier-only (every role, incl. CONTACT_INITIATOR)", () => {
    const ci = getPermissionsForRole(USER_ROLES.CONTACT_INITIATOR);
    for (const code of LEAF_ALL) {
      expect(ci).toContain(code);
    }
  });
});

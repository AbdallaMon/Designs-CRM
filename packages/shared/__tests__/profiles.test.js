import { describe, it, expect } from "vitest";
import { PROFILES, PROFILE_KEYS, PROFILE_META, deriveProfileFromLegacy, resolveProfileKey }
  from "../constants/access/profiles.js";
import { ROLE_PERMISSIONS, SUPER_SALES_EXTRA_PERMISSIONS } from "../constants/access/role-permissions.js";
import { ALL_PERMISSIONS } from "../constants/access/permissions.constants.js";

const set = (a) => new Set(a);
const eq = (a, b) => set(a).size === set(b).size && a.every((x) => set(b).has(x));

describe("profiles map", () => {
  it("every profile key has a code array and a PROFILE_META entry", () => {
    for (const key of PROFILE_KEYS) {
      expect(Array.isArray(PROFILES[key])).toBe(true);
      expect(PROFILE_META[key]).toBeTruthy();
      expect(PROFILE_META[key].baseRole).toBeTruthy();
    }
  });

  it("all profile codes are real permission codes", () => {
    const universe = set(ALL_PERMISSIONS);
    for (const key of PROFILE_KEYS)
      for (const code of PROFILES[key]) expect(universe.has(code)).toBe(true);
  });

  it("NORMAL_SALES equals STAFF role codes plus ANALYSIS_VIEW", () => {
    const staff = ROLE_PERMISSIONS.STAFF;
    const extra = PROFILES.NORMAL_SALES.filter((c) => !staff.includes(c));
    expect(extra).toEqual(["lead.analysis.view"]);
  });

  it("SUPER_SALES ⊇ PRIMARY_SALES ⊇ NORMAL_SALES", () => {
    const sup = set(PROFILES.SUPER_SALES), pri = set(PROFILES.PRIMARY_SALES);
    expect(PROFILES.PRIMARY_SALES.every((c) => sup.has(c))).toBe(true);
    expect(PROFILES.NORMAL_SALES.every((c) => pri.has(c))).toBe(true);
  });

  it("SUPER_SALES includes the isSuperSales admin-tier extras", () => {
    const sup = set(PROFILES.SUPER_SALES);
    expect(SUPER_SALES_EXTRA_PERMISSIONS.every((c) => sup.has(c))).toBe(true);
  });
});

describe("deriveProfileFromLegacy", () => {
  const cases = [
    [{ role: "STAFF" }, "NORMAL_SALES"],
    [{ role: "STAFF", isPrimary: true }, "PRIMARY_SALES"],
    [{ role: "STAFF", isSuperSales: true }, "SUPER_SALES"],
    [{ role: "STAFF", isPrimary: true, isSuperSales: true }, "SUPER_SALES"],
    [{ role: "ADMIN" }, "ADMIN"],
    [{ role: "SUPER_ADMIN" }, "SUPER_ADMIN"],
    [{ role: "SUPER_SALES" }, "SUPER_SALES_BASE"],
    [{ role: "ACCOUNTANT" }, "ACCOUNTANT"],
    [{ role: "THREE_D_DESIGNER" }, "DESIGNER_3D"],
    [{ role: "TWO_D_DESIGNER" }, "DESIGNER_2D"],
    [{ role: "TWO_D_EXECUTOR" }, "EXECUTOR_2D"],
    [{ role: "CONTACT_INITIATOR" }, "CONTACT_INITIATOR"],
  ];
  it.each(cases)("%o -> %s", (user, expected) => {
    expect(deriveProfileFromLegacy(user)).toBe(expected);
  });
});

describe("resolveProfileKey", () => {
  it("prefers a valid user.profile", () => {
    expect(resolveProfileKey({ profile: "PRIMARY_SALES", role: "STAFF" })).toBe("PRIMARY_SALES");
  });
  it("falls back to legacy derivation for an unset/invalid profile", () => {
    expect(resolveProfileKey({ profile: null, role: "STAFF", isPrimary: true })).toBe("PRIMARY_SALES");
    expect(resolveProfileKey({ profile: "NOPE", role: "ADMIN" })).toBe("ADMIN");
  });
});

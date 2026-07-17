import { describe, it, expect } from "vitest";
import { PROFILES, PROFILE_KEYS, PROFILE_META, deriveProfileFromLegacy, deriveProfilesFromLegacy, resolveProfileKey }
  from "../constants/access/profiles.js";
import { ROLE_PERMISSIONS, SUPER_SALES_EXTRA_PERMISSIONS } from "../constants/access/role-permissions.js";
import { ALL_PERMISSIONS } from "../constants/access/permissions.constants.js";
import { getEffectivePermissions, getPermissionsForRole } from "../helpers.js";

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

// The OLD formula, inlined as the parity oracle: role codes ∪ subRole codes ∪
// (isSuperSales ? EXTRA). This is exactly what master/pre-change computed.
function oldEffective(user) {
  const s = new Set(getPermissionsForRole(user.role));
  for (const e of user.subRoles ?? []) {
    const sr = typeof e === "string" ? e : e?.subRole;
    if (sr) for (const c of getPermissionsForRole(sr)) s.add(c);
  }
  if (user.isSuperSales) for (const c of SUPER_SALES_EXTRA_PERMISSIONS) s.add(c);
  return s;
}

describe("getEffectivePermissions parity (old universe)", () => {
  // NOTE: my_day.team.view is a special case — unlike the LEAD.*.view codes below
  // (pure profile-only additions never present in ROLE_PERMISSIONS), it IS part of
  // the "old" role-based universe for ADMIN/SUPER_ADMIN/SUPER_SALES (added directly
  // to their ROLE_PERMISSIONS arrays as the legacy fallback map — see
  // role-permissions.js). It is ONLY a genuinely new addition for STAFF+isSuperSales,
  // where the profile path resolves to the SUPER_SALES profile (which carries the
  // team lens) while the old role-only formula's SUPER_SALES_EXTRA_PERMISSIONS
  // deliberately does not include it. The filter below accounts for this: a
  // NEW_CODES entry is only stripped from `got` when `old` doesn't already contain it
  // — so it stays a no-op wherever old legitimately has the code, and only trims the
  // genuine profile-only extra.
  const NEW_CODES = new Set([
    "lead.price_offer.view","lead.projects.view","lead.modifications.view",
    "lead.updates.view","lead.analysis.view",
    "my_day.team.view",
  ]);
  const roles = ["ADMIN","SUPER_ADMIN","STAFF","THREE_D_DESIGNER","TWO_D_DESIGNER",
    "TWO_D_EXECUTOR","ACCOUNTANT","SUPER_SALES","CONTACT_INITIATOR"];
  const combos = [];
  for (const role of roles)
    for (const isPrimary of [false, true])
      // isSuperSales is only a meaningful axis for STAFF: resolveProfileKey /
      // deriveProfileFromLegacy only reads it when role === STAFF (mapping to the
      // SUPER_SALES profile); for every other role it is legacy noise on a row that
      // could never carry it in practice. Before Phase 4, the old formula's
      // unconditional `if (user.isSuperSales) union(EXTRA)` was mirrored by an
      // equally unconditional union in getEffectivePermissions, so those combos
      // happened to stay in parity by construction. Now that the transitional union
      // is removed, the profile-based `got` correctly stops granting the extras for
      // non-STAFF roles — so we stop asserting parity for a combination the profile
      // model (rightly) no longer treats as meaningful.
      for (const isSuperSales of role === "STAFF" ? [false, true] : [false])
        combos.push({ role, isPrimary, isSuperSales, profile: null, subRoles: [] });

  it.each(combos)("effective ∩ oldUniverse === old formula for %o", (user) => {
    const got = new Set(getEffectivePermissions(user).permissions);
    const old = oldEffective(user);
    // 1) restricting new to old codes equals the old formula (a NEW_CODES entry is
    //    only stripped when `old` doesn't already legitimately contain it):
    const gotOld = new Set([...got].filter((c) => !NEW_CODES.has(c) || old.has(c)));
    expect(gotOld).toEqual(old);
    // 2) new grants only ever ADD new codes (never remove an old one):
    for (const c of old) expect(got.has(c)).toBe(true);
  });

  it("profile path grants the new primary view codes to STAFF+isPrimary", () => {
    const perms = new Set(getEffectivePermissions({ role: "STAFF", isPrimary: true, profile: null }).permissions);
    for (const c of ["lead.price_offer.view","lead.projects.view","lead.modifications.view","lead.updates.view"])
      expect(perms.has(c)).toBe(true);
    // analysis view is granted to ALL sales incl. normal:
    expect(new Set(getEffectivePermissions({ role: "STAFF", profile: null }).permissions).has("lead.analysis.view")).toBe(true);
  });
});

describe("deriveProfilesFromLegacy", () => {
  it("single-role user → one profile, current == it", () => {
    expect(deriveProfilesFromLegacy({ role: "ACCOUNTANT" }))
      .toEqual({ profiles: ["ACCOUNTANT"], current: "ACCOUNTANT" });
  });
  it("STAFF+isSuperSales → SUPER_SALES current", () => {
    expect(deriveProfilesFromLegacy({ role: "STAFF", isSuperSales: true }))
      .toEqual({ profiles: ["SUPER_SALES"], current: "SUPER_SALES" });
  });
  it("base role + subRoles → union, current is base", () => {
    const r = deriveProfilesFromLegacy({ role: "STAFF", subRoles: [{ subRole: "ACCOUNTANT" }] });
    expect(r.current).toBe("NORMAL_SALES");
    expect(new Set(r.profiles)).toEqual(new Set(["NORMAL_SALES", "ACCOUNTANT"]));
  });
});

describe("getEffectivePermissions ignores legacy subRoles + isSuperSales", () => {
  it("does not union subRole codes into the effective set", () => {
    const withSub = new Set(getEffectivePermissions({ role: "STAFF", profile: "NORMAL_SALES", subRoles: [{ subRole: "ACCOUNTANT" }] }).permissions);
    const without = new Set(getEffectivePermissions({ role: "STAFF", profile: "NORMAL_SALES" }).permissions);
    expect([...withSub].sort()).toEqual([...without].sort());
  });
  it("does not union isSuperSales extras when the profile is NORMAL_SALES", () => {
    const flagged = new Set(getEffectivePermissions({ role: "STAFF", profile: "NORMAL_SALES", isSuperSales: true }).permissions);
    const plain = new Set(getEffectivePermissions({ role: "STAFF", profile: "NORMAL_SALES" }).permissions);
    expect([...flagged].sort()).toEqual([...plain].sort());
  });
});

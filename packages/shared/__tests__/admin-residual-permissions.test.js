import { describe, it, expect } from "vitest";
import {
  getEffectivePermissions,
  getPermissionsForRole,
  PERMISSIONS,
  USER_ROLES,
  ALL_USER_ROLES,
  ALL_PERMISSIONS,
  ADMIN_ARCHIVE_MODEL_ALLOWLIST,
} from "../index.js";

const P = PERMISSIONS;

// The full admin-residual code set. Legacy `/admin` gate "ADMIN" admits the `isAdmin` union
// (ADMIN/SUPER_ADMIN base + isSuperSales + ADMIN/SUPER_ADMIN sub-roles). So these are granted
// to ADMIN/SUPER_ADMIN base + isSuperSales (via SUPER_SALES_EXTRA_PERMISSIONS).
const ADMIN_RESIDUAL_ALL = Object.values(P.ADMIN_RESIDUAL);
// The legacy `/staff` gate admits EXACTLY these five base roles.
const STAFF_GATE_ROLES = [
  USER_ROLES.STAFF,
  USER_ROLES.THREE_D_DESIGNER,
  USER_ROLES.TWO_D_DESIGNER,
  USER_ROLES.ACCOUNTANT,
  USER_ROLES.TWO_D_EXECUTOR,
];

describe("admin-residual permission grants", () => {
  it("registers ADMIN_RESIDUAL + STAFF in the aggregate + ALL_PERMISSIONS", () => {
    expect(ADMIN_RESIDUAL_ALL.length).toBeGreaterThan(0);
    for (const code of [...ADMIN_RESIDUAL_ALL, P.STAFF.LATEST_CALLS_VIEW]) {
      expect(typeof code).toBe("string");
      expect(ALL_PERMISSIONS).toContain(code);
    }
  });

  it("grants the full admin-residual surface to ADMIN + SUPER_ADMIN base roles", () => {
    for (const role of [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]) {
      const codes = getPermissionsForRole(role);
      for (const code of ADMIN_RESIDUAL_ALL) expect(codes).toContain(code);
    }
  });

  it("layers the admin-residual surface onto isSuperSales (matching the legacy isAdmin union)", () => {
    // base SUPER_SALES role does NOT hold them; the isSuperSales flag layers them on.
    const baseSuperSales = getPermissionsForRole(USER_ROLES.SUPER_SALES);
    for (const code of ADMIN_RESIDUAL_ALL) expect(baseSuperSales).not.toContain(code);

    const withFlag = getEffectivePermissions({ role: USER_ROLES.SUPER_SALES, isSuperSales: true }).permissions;
    for (const code of ADMIN_RESIDUAL_ALL) expect(withFlag).toContain(code);
  });

  it("does NOT grant ANY admin-residual code to plain STAFF/sales/designer/accountant", () => {
    for (const role of [
      USER_ROLES.STAFF,
      USER_ROLES.THREE_D_DESIGNER,
      USER_ROLES.TWO_D_DESIGNER,
      USER_ROLES.TWO_D_EXECUTOR,
      USER_ROLES.ACCOUNTANT,
      USER_ROLES.CONTACT_INITIATOR,
    ]) {
      const codes = getEffectivePermissions({ role }).permissions;
      for (const code of ADMIN_RESIDUAL_ALL) expect(codes).not.toContain(code);
    }
  });

  it("ADMIN/SUPER_ADMIN sub-roles propagate the admin-residual surface (the isAdmin union)", () => {
    const withSubRole = getEffectivePermissions({
      role: USER_ROLES.STAFF,
      subRoles: [{ subRole: USER_ROLES.ADMIN }],
    }).permissions;
    for (const code of ADMIN_RESIDUAL_ALL) expect(withSubRole).toContain(code);
  });
});

describe("staff latest-calls gate", () => {
  it("grants STAFF.LATEST_CALLS_VIEW to EXACTLY the five legacy STAFF-gate base roles", () => {
    for (const role of STAFF_GATE_ROLES) {
      expect(getPermissionsForRole(role)).toContain(P.STAFF.LATEST_CALLS_VIEW);
    }
  });

  it("does NOT grant STAFF.LATEST_CALLS_VIEW to ADMIN/SUPER_ADMIN/SUPER_SALES/CONTACT_INITIATOR base roles", () => {
    for (const role of [
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.SUPER_SALES,
      USER_ROLES.CONTACT_INITIATOR,
    ]) {
      expect(getPermissionsForRole(role)).not.toContain(P.STAFF.LATEST_CALLS_VIEW);
    }
  });

  it("isSuperSales does NOT layer the staff latest-calls code", () => {
    const { permissions } = getEffectivePermissions({ role: USER_ROLES.SUPER_SALES, isSuperSales: true });
    expect(permissions).not.toContain(P.STAFF.LATEST_CALLS_VIEW);
  });
});

describe("model-archive allow-list", () => {
  it("only contains the global image-session reference models, mapped to real Prisma delegates", () => {
    expect(ADMIN_ARCHIVE_MODEL_ALLOWLIST).toEqual({
      style: "style",
      colorpattern: "colorPattern",
      material: "material",
      space: "space",
      designimage: "designImage",
    });
  });
});

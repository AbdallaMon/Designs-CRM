import { describe, it, expect } from "vitest";
import {
  getEffectivePermissions,
  getPermissionsForRole,
  buildNavigationTabs,
  PERMISSIONS,
  USER_ROLES,
  ALL_PERMISSIONS,
  PROFILES,
} from "../index.js";

const P = PERMISSIONS;
const VIEW = P.COMMAND_CENTER.VIEW;

// Every role that must NOT hold the command center (admin-only surface).
const NON_ADMIN_ROLES = [
  USER_ROLES.STAFF,
  USER_ROLES.ACCOUNTANT,
  USER_ROLES.THREE_D_DESIGNER,
  USER_ROLES.TWO_D_DESIGNER,
  USER_ROLES.TWO_D_EXECUTOR,
  USER_ROLES.CONTACT_INITIATOR,
  USER_ROLES.SUPER_SALES,
];

describe("command_center.view permission wiring", () => {
  it("registers PERMISSIONS.COMMAND_CENTER.VIEW in the aggregate + ALL_PERMISSIONS", () => {
    expect(VIEW).toBe("command_center.view");
    expect(ALL_PERMISSIONS).toContain(VIEW);
  });

  it("grants command_center.view to ADMIN + SUPER_ADMIN base roles", () => {
    for (const role of [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]) {
      expect(getPermissionsForRole(role)).toContain(VIEW);
      expect(getEffectivePermissions({ role }).permissions).toContain(VIEW);
    }
  });

  it("does NOT grant command_center.view to any non-admin role", () => {
    for (const role of NON_ADMIN_ROLES) {
      expect(getPermissionsForRole(role)).not.toContain(VIEW);
      expect(getEffectivePermissions({ role }).permissions).not.toContain(VIEW);
    }
  });

  it("does NOT layer command_center.view onto isSuperSales (admin-only, not an isSuperSales surface)", () => {
    const { permissions } = getEffectivePermissions({ role: USER_ROLES.SUPER_SALES, isSuperSales: true });
    expect(permissions).not.toContain(VIEW);
    const staffSuper = getEffectivePermissions({ role: USER_ROLES.STAFF, isSuperSales: true });
    expect(staffSuper.permissions).not.toContain(VIEW);
  });

  it("is present in the ADMIN + SUPER_ADMIN profiles, absent from every other profile", () => {
    expect(PROFILES.ADMIN).toContain(VIEW);
    expect(PROFILES.SUPER_ADMIN).toContain(VIEW);
    for (const key of Object.keys(PROFILES)) {
      if (key === "ADMIN" || key === "SUPER_ADMIN") continue;
      expect(PROFILES[key]).not.toContain(VIEW);
    }
  });
});

describe("Command Center nav tab (admin-only)", () => {
  const href = "/dashboard/command-center";
  const hasTab = (u) => buildNavigationTabs(u).some((t) => t.href === href);

  it("shows the Command Center tab for ADMIN + SUPER_ADMIN", () => {
    expect(hasTab({ role: USER_ROLES.ADMIN })).toBe(true);
    expect(hasTab({ role: USER_ROLES.SUPER_ADMIN })).toBe(true);
  });

  it("hides the Command Center tab for every non-admin role (incl. STAFF+isSuperSales)", () => {
    for (const role of NON_ADMIN_ROLES) expect(hasTab({ role })).toBe(false);
    expect(hasTab({ role: USER_ROLES.STAFF, isSuperSales: true })).toBe(false);
  });
});

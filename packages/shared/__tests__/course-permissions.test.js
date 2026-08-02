import { permissionsForPersona, profileForPersona } from "./profile-fixtures.js";
import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  USER_ROLES,
  getEffectivePermissions,
  hasPermission,
} from "../index.js";

const ADMIN_CODES = [
  PERMISSIONS.COURSE.VIEW,
  PERMISSIONS.COURSE.MANAGE,
  PERMISSIONS.COURSE.ACCESS_MANAGE,
  PERMISSIONS.COURSE.ATTEMPT_MANAGE,
];
const STAFF_CODES = [PERMISSIONS.STAFF_COURSE.VIEW, PERMISSIONS.STAFF_COURSE.TAKE];

// Behavior-preserving grant checks for the migrated Courses/LMS module:
//   - admin-course (legacy `/admin/courses`, "ADMIN" gate) → ADMIN / SUPER_ADMIN /
//     ADMIN-or-SUPER_ADMIN sub-role / isSuperSales.
//   - staff-course (legacy `/shared/courses`, "SHARED" gate) → EVERY authenticated role.
describe("Courses permission grants (preserve legacy access)", () => {
  it("ADMIN holds all four admin-course codes", () => {
    const { permissions } = getEffectivePermissions({ profile: profileForPersona(USER_ROLES.ADMIN ) });
    for (const code of ADMIN_CODES) {
      expect(hasPermission(permissions, code)).toBe(true);
    }
  });

  it("SUPER_ADMIN holds all four admin-course codes", () => {
    const { permissions } = getEffectivePermissions({
      profile: profileForPersona(USER_ROLES.SUPER_ADMIN),
    });
    for (const code of ADMIN_CODES) {
      expect(hasPermission(permissions, code)).toBe(true);
    }
  });

  it("a plain STAFF user holds staff-course codes but NOT admin-course codes", () => {
    const { permissions } = getEffectivePermissions({ profile: profileForPersona(USER_ROLES.STAFF ) });
    for (const code of STAFF_CODES) {
      expect(hasPermission(permissions, code)).toBe(true);
    }
    for (const code of ADMIN_CODES) {
      expect(hasPermission(permissions, code)).toBe(false);
    }
  });

  it("SUPER_SALES course access comes from its active profile", () => {
    const { permissions } = getEffectivePermissions({
      profile: "SUPER_SALES",
    });
    for (const code of ADMIN_CODES) {
      expect(hasPermission(permissions, code)).toBe(true);
    }
  });

  it("the ADMIN profile grants admin-course codes to a non-admin base role (profile is the sole source)", () => {
    const { permissions } = getEffectivePermissions({
      role: USER_ROLES.STAFF,
      profile: "ADMIN",
    });
    for (const code of ADMIN_CODES) {
      expect(hasPermission(permissions, code)).toBe(true);
    }
  });

  it("every role holds the two staff-course consumption codes", () => {
    for (const role of Object.values(USER_ROLES)) {
      const { permissions } = getEffectivePermissions({ profile: profileForPersona(role) });
      for (const code of STAFF_CODES) {
        expect(hasPermission(permissions, code)).toBe(true);
      }
    }
  });
});

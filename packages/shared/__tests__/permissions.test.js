import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  computeCapabilities,
  getEffectivePermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  PERMISSIONS,
  PROFILE_KEYS,
  PROFILES,
} from "../index.js";

describe("profile permissions", () => {
  it("maps every active profile to permission codes", () => {
    for (const profile of PROFILE_KEYS) {
      expect(Array.isArray(PROFILES[profile])).toBe(true);
      expect(PROFILES[profile].length).toBeGreaterThan(0);
    }
  });

  it("returns no permissions without a valid active profile", () => {
    expect(getEffectivePermissions(null)).toEqual({
      permissions: [],
      permissionsByModule: {},
    });
    expect(getEffectivePermissions({})).toEqual({
      permissions: [],
      permissionsByModule: {},
    });
    expect(getEffectivePermissions({ profile: "UNKNOWN" }).permissions).toEqual([]);
  });

  it("does not infer access from retained schema fields", () => {
    const retainedFieldsOnly = getEffectivePermissions({
      role: "ADMIN",
      subRoles: ["SUPER_ADMIN"],
      isPrimary: true,
      isSuperSales: true,
    });
    expect(retainedFieldsOnly.permissions).toEqual([]);
  });

  it("ADMIN and SUPER_ADMIN can do anything", () => {
    for (const profile of ["ADMIN", "SUPER_ADMIN"]) {
      const { permissions } = getEffectivePermissions({ profile });
      expect(new Set(permissions)).toEqual(new Set(ALL_PERMISSIONS));
    }
  });

  it("groups profile permissions into module action flags", () => {
    const { permissionsByModule } = getEffectivePermissions({ profile: "ADMIN" });
    expect(permissionsByModule.lead.codes).toContain(PERMISSIONS.LEAD.LIST);
    expect(permissionsByModule.lead.canList).toBe(true);
    expect(permissionsByModule.user.canCreate).toBe(true);
  });

  it("sales elevation comes from the active profile only", () => {
    const normal = getEffectivePermissions({ profile: "NORMAL_SALES" }).permissions;
    const elevated = getEffectivePermissions({ profile: "SUPER_SALES" }).permissions;
    expect(normal).not.toContain(PERMISSIONS.USER.MANAGE_PROFILES);
    expect(elevated).toContain(PERMISSIONS.USER.MANAGE_PROFILES);
  });
});

describe("permission helpers", () => {
  const permissions = [
    PERMISSIONS.CHAT.ROOM_VIEW,
    PERMISSIONS.CHAT.ROOM_LIST,
  ];

  it("checks one, all, or any code", () => {
    expect(hasPermission(permissions, PERMISSIONS.CHAT.ROOM_VIEW)).toBe(true);
    expect(
      hasAllPermissions(permissions, [
        PERMISSIONS.CHAT.ROOM_VIEW,
        PERMISSIONS.CHAT.ROOM_LIST,
      ]),
    ).toBe(true);
    expect(
      hasAnyPermission(permissions, [
        PERMISSIONS.TELEGRAM.MANAGE,
        PERMISSIONS.CHAT.ROOM_VIEW,
      ]),
    ).toBe(true);
  });

  it("computes rendering capabilities safely", () => {
    const capabilities = computeCapabilities(
      {
        canEdit: ({ permissions: codes }) =>
          hasPermission(codes, PERMISSIONS.CHAT.ROOM_EDIT),
        invalidRule: () => {
          throw new Error("test invariant");
        },
      },
      { permissions: [PERMISSIONS.CHAT.ROOM_EDIT] },
    );
    expect(capabilities).toEqual({ canEdit: true, invalidRule: false });
  });
});

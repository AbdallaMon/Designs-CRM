import { describe, it, expect } from "vitest";
import {
  getEffectivePermissions,
  getPermissionsForRole,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  computeCapabilities,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  USER_ROLES,
  ALL_USER_ROLES,
} from "../index.js";

describe("ROLE_PERMISSIONS map", () => {
  it("maps every UserRole value (no role is unmapped)", () => {
    for (const role of ALL_USER_ROLES) {
      expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
    }
  });

  it("grants telegram.manage ONLY to ADMIN and SUPER_ADMIN (preserves ADMIN-only behavior)", () => {
    for (const role of ALL_USER_ROLES) {
      const has = getPermissionsForRole(role).includes(
        PERMISSIONS.TELEGRAM.MANAGE,
      );
      if (role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN) {
        expect(has).toBe(true);
      } else {
        expect(has).toBe(false);
      }
    }
  });

  it("grants the shared authed surface (chat/upload/auth.me) to every role", () => {
    for (const role of ALL_USER_ROLES) {
      const codes = getPermissionsForRole(role);
      expect(codes).toContain(PERMISSIONS.AUTH.ME);
      expect(codes).toContain(PERMISSIONS.AUTH.LOGOUT);
      expect(codes).toContain(PERMISSIONS.CHAT.ROOM_LIST);
      expect(codes).toContain(PERMISSIONS.UPLOAD.FILE_UPLOAD);
    }
  });
});

describe("getEffectivePermissions", () => {
  it("returns empty for null/undefined user", () => {
    expect(getEffectivePermissions(null)).toEqual({
      permissions: [],
      permissionsByModule: {},
    });
  });

  it("ADMIN gets the full set including telegram.manage", () => {
    const { permissions, permissionsByModule } = getEffectivePermissions({
      role: USER_ROLES.ADMIN,
    });
    expect(permissions).toContain(PERMISSIONS.TELEGRAM.MANAGE);
    expect(permissions).toContain(PERMISSIONS.CHAT.ROOM_VIEW);
    // grouped by module for nav lookups
    expect(permissionsByModule.telegram).toContain(PERMISSIONS.TELEGRAM.MANAGE);
    expect(permissionsByModule.chat).toContain(PERMISSIONS.CHAT.ROOM_VIEW);
  });

  it("STAFF does NOT get telegram.manage", () => {
    const { permissions } = getEffectivePermissions({ role: USER_ROLES.STAFF });
    expect(permissions).not.toContain(PERMISSIONS.TELEGRAM.MANAGE);
    expect(permissions).toContain(PERMISSIONS.CHAT.ROOM_VIEW);
  });

  it("each base role resolves to exactly its mapped codes (deduped)", () => {
    for (const role of ALL_USER_ROLES) {
      const { permissions } = getEffectivePermissions({ role });
      const expected = Array.from(new Set(ROLE_PERMISSIONS[role]));
      expect(permissions.sort()).toEqual(expected.sort());
    }
  });

  it("unions sub-role codes (Prisma {subRole} row shape)", () => {
    // a STAFF user who ALSO holds an ADMIN sub-role gains telegram.manage
    const { permissions } = getEffectivePermissions({
      role: USER_ROLES.STAFF,
      subRoles: [{ subRole: USER_ROLES.ADMIN }],
    });
    expect(permissions).toContain(PERMISSIONS.TELEGRAM.MANAGE);
  });

  it("unions sub-role codes (plain string[] shape)", () => {
    const { permissions } = getEffectivePermissions({
      role: USER_ROLES.STAFF,
      subRoles: [USER_ROLES.ADMIN],
    });
    expect(permissions).toContain(PERMISSIONS.TELEGRAM.MANAGE);
  });

  it("does not double-count when role and sub-role overlap", () => {
    const { permissions } = getEffectivePermissions({
      role: USER_ROLES.ADMIN,
      subRoles: [{ subRole: USER_ROLES.ADMIN }],
    });
    const unique = new Set(permissions);
    expect(unique.size).toBe(permissions.length);
  });

  it("isSuperSales augments without breaking (empty extra set today)", () => {
    const base = getEffectivePermissions({ role: USER_ROLES.STAFF });
    const elevated = getEffectivePermissions({
      role: USER_ROLES.STAFF,
      isSuperSales: true,
    });
    // no extra codes defined yet, so the set is unchanged — but the path runs
    expect(elevated.permissions.sort()).toEqual(base.permissions.sort());
  });
});

describe("hasPermission helpers", () => {
  const perms = [PERMISSIONS.CHAT.ROOM_VIEW, PERMISSIONS.CHAT.ROOM_LIST];
  it("hasPermission", () => {
    expect(hasPermission(perms, PERMISSIONS.CHAT.ROOM_VIEW)).toBe(true);
    expect(hasPermission(perms, PERMISSIONS.TELEGRAM.MANAGE)).toBe(false);
  });
  it("hasAllPermissions / hasAnyPermission", () => {
    expect(
      hasAllPermissions(perms, [
        PERMISSIONS.CHAT.ROOM_VIEW,
        PERMISSIONS.CHAT.ROOM_LIST,
      ]),
    ).toBe(true);
    expect(
      hasAllPermissions(perms, [
        PERMISSIONS.CHAT.ROOM_VIEW,
        PERMISSIONS.TELEGRAM.MANAGE,
      ]),
    ).toBe(false);
    expect(
      hasAnyPermission(perms, [PERMISSIONS.TELEGRAM.MANAGE, PERMISSIONS.CHAT.ROOM_VIEW]),
    ).toBe(true);
  });
});

describe("computeCapabilities", () => {
  it("evaluates each rule against the context and coerces to boolean", () => {
    const caps = computeCapabilities(
      {
        canEdit: ({ permissions, record, authUserId }) =>
          hasPermission(permissions, PERMISSIONS.CHAT.ROOM_EDIT) &&
          record.createdById === authUserId,
        canDelete: ({ permissions, record, authUserId }) =>
          hasPermission(permissions, PERMISSIONS.CHAT.ROOM_DELETE) &&
          record.createdById === authUserId,
      },
      {
        permissions: [PERMISSIONS.CHAT.ROOM_EDIT],
        record: { createdById: 7 },
        authUserId: 7,
      },
    );
    expect(caps).toEqual({ canEdit: true, canDelete: false });
  });

  it("a throwing rule yields false rather than blowing up", () => {
    const caps = computeCapabilities(
      { boom: () => { throw new Error("x"); } },
      {},
    );
    expect(caps.boom).toBe(false);
  });
});

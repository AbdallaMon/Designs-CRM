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

// The broad project-domain codes EVERY authed role held in legacy (any authed role
// could reach `/shared/{projects,tasks,updates,delivery}`; object scope is what differs).
const PROJECT_AUTHED = [
  P.PROJECT.LIST, P.PROJECT.VIEW, P.PROJECT.EDIT,
  P.TASK.LIST, P.TASK.VIEW, P.TASK.CREATE, P.TASK.EDIT, P.TASK.DELETE, P.TASK.NOTE_MANAGE,
  P.UPDATE.LIST, P.UPDATE.CREATE, P.UPDATE.AUTHORIZE, P.UPDATE.ARCHIVE, P.UPDATE.MARK_DONE,
  P.DELIVERY.LIST, P.DELIVERY.CREATE, P.DELIVERY.LINK_MEETING, P.DELIVERY.DELETE,
];

describe("projects-domain permission grants", () => {
  it("registers PROJECT/TASK/UPDATE/DELIVERY in the aggregate + ALL_PERMISSIONS", () => {
    for (const code of [...PROJECT_AUTHED, P.PROJECT.MANAGE]) {
      expect(typeof code).toBe("string");
      expect(ALL_PERMISSIONS).toContain(code);
    }
  });

  it("grants the broad project-domain surface to EVERY authed role (legacy SHARED gate)", () => {
    for (const role of ALL_USER_ROLES) {
      const codes = getPermissionsForRole(role);
      for (const code of PROJECT_AUTHED) {
        expect(codes).toContain(code);
      }
    }
  });

  it("grants project.manage ONLY to ADMIN/SUPER_ADMIN base (legacy isAdmin)", () => {
    for (const role of ALL_USER_ROLES) {
      const has = getPermissionsForRole(role).includes(P.PROJECT.MANAGE);
      if (role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN) {
        expect(has).toBe(true);
      } else {
        expect(has).toBe(false);
      }
    }
  });

  it("a non-admin designer does NOT get project.manage", () => {
    const { permissions } = getEffectivePermissions({ role: USER_ROLES.THREE_D_DESIGNER });
    expect(permissions).toContain(P.PROJECT.VIEW);
    expect(permissions).not.toContain(P.PROJECT.MANAGE);
  });

  it("isSuperSales layers project.manage on top (legacy isAdmin admits isSuperSales)", () => {
    const { permissions } = getEffectivePermissions({ role: USER_ROLES.STAFF, isSuperSales: true });
    expect(permissions).toContain(P.PROJECT.MANAGE);
  });
});

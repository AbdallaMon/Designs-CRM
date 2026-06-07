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

// The dashboard code set. Legacy `routes/shared/dashboard.js` sat behind the SHARED
// router-level gate (verifyTokenAndHandleAuthorization(..., "SHARED")), which admits EVERY
// authed role, with NO per-endpoint role split (the per-request data SCOPE is what differs,
// enforced in the usecase). So the single DASHBOARD.VIEW code is granted to all roles.
const DASHBOARD_ALL = Object.values(P.DASHBOARD);

describe("dashboard permission grants", () => {
  it("registers DASHBOARD in the aggregate + ALL_PERMISSIONS (single view code)", () => {
    expect(Object.keys(P.DASHBOARD)).toEqual(["VIEW"]);
    for (const code of DASHBOARD_ALL) {
      expect(typeof code).toBe("string");
      expect(ALL_PERMISSIONS).toContain(code);
    }
    expect(P.DASHBOARD.VIEW).toBe("dashboard.view");
  });

  it("grants dashboard.view to EVERY authed role (legacy SHARED gate parity)", () => {
    for (const role of ALL_USER_ROLES) {
      const codes = getPermissionsForRole(role);
      expect(codes, `${role} should hold dashboard.view`).toContain(P.DASHBOARD.VIEW);
    }
  });

  it("effective permissions for a scoped role include dashboard.view", () => {
    const staff = getEffectivePermissions({ role: USER_ROLES.STAFF }).permissions;
    expect(staff).toContain(P.DASHBOARD.VIEW);
    const designer = getEffectivePermissions({ role: USER_ROLES.THREE_D_DESIGNER }).permissions;
    expect(designer).toContain(P.DASHBOARD.VIEW);
  });
});

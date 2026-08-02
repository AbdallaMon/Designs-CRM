import { permissionsForPersona, profileForPersona } from "./profile-fixtures.js";
import { describe, it, expect } from "vitest";
import {
  getEffectivePermissions,
  PERMISSIONS,
  USER_ROLES,
  ALL_USER_ROLES,
  ALL_PERMISSIONS,
} from "../index.js";

const P = PERMISSIONS;

// The full accounting code set. Legacy `/accountant` gate admits ONLY the ACCOUNTANT base
// role (verifyTokenAndHandleAuthorization(..., "ACCOUNTANT") → falls to decoded.role !==
// role; the isAdmin early-return fires only when the role PARAM is "ADMIN"). So these are
// granted to ACCOUNTANT only.
const ACCOUNTING_ALL = Object.values(P.ACCOUNTING);

describe("accounting permission grants", () => {
  it("registers ACCOUNTING in the aggregate + ALL_PERMISSIONS", () => {
    expect(Object.keys(P.ACCOUNTING).length).toBeGreaterThan(0);
    for (const code of ACCOUNTING_ALL) {
      expect(typeof code).toBe("string");
      expect(ALL_PERMISSIONS).toContain(code);
    }
  });

  it("grants the full accounting surface to the ACCOUNTANT role (legacy ACCOUNTANT gate)", () => {
    const codes = permissionsForPersona(USER_ROLES.ACCOUNTANT);
    for (const code of ACCOUNTING_ALL) {
      expect(codes).toContain(code);
    }
  });

  it("does not grant accounting codes outside accountant/admin profiles", () => {
    for (const role of ALL_USER_ROLES) {
      if (
        [USER_ROLES.ACCOUNTANT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(
          role,
        )
      ) {
        continue;
      }
      const codes = permissionsForPersona(role);
      for (const code of ACCOUNTING_ALL) {
        expect(codes).not.toContain(code);
      }
    }
  });

  it("isSuperSales does NOT layer accounting codes (legacy gate did not admit isSuperSales)", () => {
    const { permissions } = getEffectivePermissions({ profile: profileForPersona(USER_ROLES.STAFF, { superSales: true }) });
    for (const code of ACCOUNTING_ALL) {
      expect(permissions).not.toContain(code);
    }
  });

  it("an ACCOUNTANT can process payments + pay salaries; a STAFF/designer cannot", () => {
    const acc = getEffectivePermissions({ profile: profileForPersona(USER_ROLES.ACCOUNTANT ) }).permissions;
    expect(acc).toContain(P.ACCOUNTING.PAYMENT_PROCESS);
    expect(acc).toContain(P.ACCOUNTING.SALARY_PAY);

    const staff = getEffectivePermissions({ profile: profileForPersona(USER_ROLES.STAFF ) }).permissions;
    expect(staff).not.toContain(P.ACCOUNTING.PAYMENT_PROCESS);
    expect(staff).not.toContain(P.ACCOUNTING.SALARY_PAY);

    const designer = getEffectivePermissions({ profile: profileForPersona(USER_ROLES.THREE_D_DESIGNER ) }).permissions;
    expect(designer).not.toContain(P.ACCOUNTING.PAYMENT_PROCESS);
  });
});

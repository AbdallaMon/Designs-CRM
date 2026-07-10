import { describe, it, expect } from "vitest";
import {
  getEffectivePermissions,
  getPermissionsForRole,
  buildNavigationTabs,
  PERMISSIONS,
  USER_ROLES,
  ALL_PERMISSIONS,
  PROFILES,
  AUDIT_ACTIONS,
  AUDIT_MODULES,
} from "../index.js";

const P = PERMISSIONS;
const VIEW = P.AUDIT.LOG_VIEW;

// Every role that must NOT hold the audit viewer (admin-only surface).
const NON_ADMIN_ROLES = [
  USER_ROLES.STAFF,
  USER_ROLES.ACCOUNTANT,
  USER_ROLES.THREE_D_DESIGNER,
  USER_ROLES.TWO_D_DESIGNER,
  USER_ROLES.TWO_D_EXECUTOR,
  USER_ROLES.CONTACT_INITIATOR,
  USER_ROLES.SUPER_SALES,
];

describe("audit.log.view permission wiring", () => {
  it("registers PERMISSIONS.AUDIT.LOG_VIEW in the aggregate + ALL_PERMISSIONS", () => {
    expect(VIEW).toBe("audit.log.view");
    expect(ALL_PERMISSIONS).toContain(VIEW);
  });

  it("grants audit.log.view to ADMIN + SUPER_ADMIN base roles", () => {
    for (const role of [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]) {
      expect(getPermissionsForRole(role)).toContain(VIEW);
      expect(getEffectivePermissions({ role }).permissions).toContain(VIEW);
    }
  });

  it("does NOT grant audit.log.view to any non-admin role", () => {
    for (const role of NON_ADMIN_ROLES) {
      expect(getPermissionsForRole(role)).not.toContain(VIEW);
      expect(getEffectivePermissions({ role }).permissions).not.toContain(VIEW);
    }
  });

  it("does NOT layer audit.log.view onto isSuperSales (admin-only, not an isSuperSales surface)", () => {
    const { permissions } = getEffectivePermissions({ role: USER_ROLES.SUPER_SALES, isSuperSales: true });
    expect(permissions).not.toContain(VIEW);
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

describe("Audit Log nav tab (admin-only)", () => {
  const auditHref = "/dashboard/audit-logs";
  const hasAudit = (u) => buildNavigationTabs(u).some((t) => t.href === auditHref);

  it("shows the Audit Log tab for ADMIN + SUPER_ADMIN", () => {
    expect(hasAudit({ role: USER_ROLES.ADMIN })).toBe(true);
    expect(hasAudit({ role: USER_ROLES.SUPER_ADMIN })).toBe(true);
  });

  it("hides the Audit Log tab for every non-admin role (incl. STAFF+isSuperSales)", () => {
    for (const role of NON_ADMIN_ROLES) expect(hasAudit({ role })).toBe(false);
    expect(hasAudit({ role: USER_ROLES.STAFF, isSuperSales: true })).toBe(false);
  });
});

describe("audit-actions vocabulary", () => {
  it("exposes the module + action code maps", () => {
    expect(AUDIT_MODULES.LEAD).toBe("lead");
    expect(AUDIT_MODULES.AUTH).toBe("auth");
    expect(AUDIT_ACTIONS.LEAD_CREATED).toBe("LEAD_CREATED");
    expect(AUDIT_ACTIONS.CONTRACT_PAYMENT_PAID).toBe("CONTRACT_PAYMENT_PAID");
  });
});

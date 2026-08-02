import { permissionsForPersona, profileForPersona } from "./profile-fixtures.js";
import { describe, it, expect } from "vitest";
import {
  getEffectivePermissions,
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
      expect(permissionsForPersona(role)).toContain(VIEW);
      expect(getEffectivePermissions({ profile: profileForPersona(role) }).permissions).toContain(VIEW);
    }
  });

  it("does NOT grant audit.log.view to any non-admin role", () => {
    for (const role of NON_ADMIN_ROLES) {
      expect(permissionsForPersona(role)).not.toContain(VIEW);
      expect(getEffectivePermissions({ profile: profileForPersona(role) }).permissions).not.toContain(VIEW);
    }
  });

  it("does NOT layer audit.log.view onto isSuperSales (admin-only, not an isSuperSales surface)", () => {
    const { permissions } = getEffectivePermissions({ profile: profileForPersona(USER_ROLES.SUPER_SALES, { superSales: true }) });
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

// ⏸️ 2026-07-16 (user request): the Audit Log nav row is COMMENTED OUT in navigation.js and
// the page renders blank. The `audit.log.view` grants above stay wired (the backend endpoint
// + recordAction trail are untouched), so restoring the screen is un-commenting the row +
// the page body. While disabled, NO role sees the tab.
describe("Audit Log nav tab (disabled — hidden from every role)", () => {
  const auditHref = "/dashboard/audit-logs";
  const hasAudit = (u) => buildNavigationTabs(u).some((t) => t.href === auditHref);

  it("hides the Audit Log tab for admins too while the screen is disabled", () => {
    expect(hasAudit({ role: USER_ROLES.ADMIN })).toBe(false);
    expect(hasAudit({ role: USER_ROLES.SUPER_ADMIN })).toBe(false);
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

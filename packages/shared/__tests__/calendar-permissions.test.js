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

// The full calendar code set. Legacy `routes/calendar/calendar.js` (double-mounted at
// `/shared/calendar` and `/shared/calendar-management`) + its `/google` sub-router sat
// behind the SHARED router-level gate (verifyTokenAndHandleAuthorization(..., "SHARED")),
// which admits EVERY authed role. So these are granted to all roles via CALENDAR_AUTHED.
const CALENDAR_ALL = Object.values(P.CALENDAR);

describe("calendar permission grants", () => {
  it("registers CALENDAR in the aggregate + ALL_PERMISSIONS", () => {
    expect(Object.keys(P.CALENDAR).length).toBeGreaterThan(0);
    for (const code of CALENDAR_ALL) {
      expect(typeof code).toBe("string");
      expect(ALL_PERMISSIONS).toContain(code);
    }
  });

  it("grants the full calendar surface to EVERY authed role (legacy SHARED gate parity)", () => {
    for (const role of ALL_USER_ROLES) {
      const codes = getPermissionsForRole(role);
      for (const code of CALENDAR_ALL) {
        expect(codes, `${role} should hold ${code}`).toContain(code);
      }
    }
  });

  it("read/write codes are distinct (VIEW != MANAGE, GOOGLE_VIEW != GOOGLE_MANAGE)", () => {
    expect(P.CALENDAR.VIEW).not.toBe(P.CALENDAR.MANAGE);
    expect(P.CALENDAR.GOOGLE_VIEW).not.toBe(P.CALENDAR.GOOGLE_MANAGE);
  });

  it("effective permissions for any role include calendar VIEW + MANAGE + GOOGLE_*", () => {
    const staff = getEffectivePermissions({ role: USER_ROLES.STAFF }).permissions;
    expect(staff).toContain(P.CALENDAR.VIEW);
    expect(staff).toContain(P.CALENDAR.MANAGE);
    expect(staff).toContain(P.CALENDAR.GOOGLE_VIEW);
    expect(staff).toContain(P.CALENDAR.GOOGLE_MANAGE);

    const contactInitiator = getEffectivePermissions({
      role: USER_ROLES.CONTACT_INITIATOR,
    }).permissions;
    expect(contactInitiator).toContain(P.CALENDAR.MANAGE);
  });
});

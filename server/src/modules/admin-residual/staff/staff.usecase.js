// admin-residual/staff usecase — orchestration only. The STAFF call-reminder list logic
// lives in the FROZEN `services/main/staff/staffServices.js` (`getCallReminders`) and is
// invoked via a lazy adapter (no duplication). This is the one endpoint behind the legacy
// `/staff` gate that is NOT owned by the dashboard module (it is a call-reminder list, not
// a dashboard aggregation).
//
// FIX 2 (IDOR hardening — same class the dashboard module already closed): legacy passed a
// client-supplied `?staffId` straight through. Omitting it returned ALL staff's in-progress
// call reminders, and any STAFF-gate role could pass `?staffId=<other>` to read another
// user's reminders. The STAFF gate admits ONLY individual-contributor roles (STAFF /
// THREE_D_DESIGNER / TWO_D_DESIGNER / ACCOUNTANT / TWO_D_EXECUTOR) — no manager/SUPER_SALES
// role reaches this endpoint — so we FORCE the scope to the authenticated caller's own id
// and IGNORE any client-supplied `staffId`. The frozen `getCallReminders` reads
// `searchParams.staffId` (it does `userId: Number(searchParams.staffId)`), so we hand it the
// auth-derived id under that same key. Everything else in the query is preserved.
const legacyDefaults = {
  getCallReminders: (searchParams) =>
    import("../../../../services/main/staff/staffServices.js").then((m) => m.getCallReminders(searchParams)),
};

export class StaffUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  latestCalls({ query, authUser }) {
    // Force self-scope: strip any client `staffId`, then key the frozen filter off the
    // caller's own id. A non-numeric/absent auth id surfaces as NaN at the frozen
    // `Number(searchParams.staffId)` rather than collapsing to the global (all-staff) list.
    const { staffId: _ignoredClientStaffId, ...rest } = query ?? {};
    const searchParams = { ...rest, staffId: authUser.id };
    return this.legacy.getCallReminders(searchParams);
  }
}

export const staffUsecase = new StaffUsecase();

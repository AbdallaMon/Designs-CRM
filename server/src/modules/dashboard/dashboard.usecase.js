// dashboard usecase — business logic / orchestration for the 9 read-only analytics
// aggregations (legacy `/shared/dashboard/*`). Prisma NEVER appears here: the heavy
// aggregations are reused 1:1 from the legacy `dashboardServices.js` via the sibling
// `dashboard.aggregations.js` module (no duplication), and the one small scoped read
// (recent-activities) goes through the repository. Behavior is ported from the legacy
// handlers with ONE deliberate security change — the scope identity is derived from
// req.auth, never from a client param.
//
// ════════════════════════════════════════════════════════════════════════════════════
//  THE IDOR-CLASS FIX (over-exposure / cross-user metric reads)
// ════════════════════════════════════════════════════════════════════════════════════
//  Legacy keyed every scoped aggregation off `searchParams.staffId` (a CLIENT-SUPPLIED
//  query param), and `getRecentActivities` ALSO off `searchParams.userId`. So:
//    - a scoped role (sales/designer/executor) could pass `?staffId=<other>` /
//      `?userId=<other>` and read ANOTHER user's metrics / activity feed, and
//    - omitting `staffId` returned the GLOBAL aggregate to everyone.
//  The `role` argument the legacy passed to getKeyMetrics / getDashboardLeadStatusData was
//  the TOKEN role (getCurrentUser decodes the JWT) — that part is fine and preserved; we
//  keep deriving role from req.auth, NEVER from a `?role=` query param.
//
//  v2 computes an EFFECTIVE staffId from the authenticated caller:
//    - admin-tier union (ADMIN / SUPER_ADMIN / isSuperSales): the client `staffId` is
//      honored as-is (scope to anyone), or omitted for the global aggregate — preserved
//      1:1 with legacy privileged behavior.
//    - every other role: staffId is FORCED to req.auth.id — they can only ever see their
//      OWN metrics (this matches the FE, which already sends the caller's own id for a
//      self-view; the ONLY thing closed is the cross-user read).
//  The sanitized searchParams handed to the legacy service carry ONLY the auth-derived
//  staffId (+ date filters + the harmless `profile` flag) — a raw client `staffId`/`userId`
//  never reaches the aggregation (the same lesson as the notifications fix: no
//  trusted-userId passthrough that makes the scope an illusion).
import { dashboardRepository } from "./dashboard.repo.js";
import {
  getKeyMetrics,
  getDashboardLeadStatusData,
  getMonthlyPerformanceData,
  getEmiratesAnalytics,
  getLeadsMonthlyOverview,
  getPerformanceMetrics,
  getLatestNewLeads,
  getDesignerMetrics,
} from "./dashboard.aggregations.js";

// Roles that historically saw GLOBAL data / could scope to ANY user on the dashboard
// (the legacy `isAdmin` union). Everyone else is forced to a self-scope.
const ADMIN_TIER_ROLES = ["ADMIN", "SUPER_ADMIN"];

class DashboardUsecase {
  // Admin-tier predicate — the legacy `isAdmin` union, read from the TOKEN (req.auth).
  #isAdminTier(authUser) {
    return (
      ADMIN_TIER_ROLES.includes(authUser?.role) ||
      authUser?.currentProfileKey === "SUPER_SALES"
    );
  }

  // Resolve the effective staffId scope from the authenticated caller. Admin-tier may
  // scope to any user (client staffId) or global (undefined); everyone else is forced to
  // their own id. NEVER reads a `?role=` param — role comes from req.auth only.
  #effectiveStaffId({ query, authUser }) {
    if (this.#isAdminTier(authUser)) {
      // honor the (already int-coerced) client staffId, else global (undefined)
      return query?.staffId ?? undefined;
    }
    // scoped role → self only. Coerce the auth-derived id to a number so a non-numeric
    // req.auth.id (a future token path / malformed legacy token) becomes NaN here rather
    // than silently surviving to a where that collapses to global (the IDOR re-opening).
    return Number(authUser.id);
  }

  // Build the sanitized searchParams forwarded to a legacy aggregation: ONLY the
  // auth-derived staffId + the date range + the harmless profile flag. A raw client
  // staffId/userId/role never survives this projection.
  #buildSearchParams({ query, authUser }) {
    const staffId = this.#effectiveStaffId({ query, authUser });
    const sp = {};
    if (staffId !== undefined && staffId !== null) sp.staffId = String(staffId);
    if (query?.startDate) sp.startDate = query.startDate;
    if (query?.endDate) sp.endDate = query.endDate;
    if (query?.profile) sp.profile = query.profile;
    return sp;
  }

  // GET /key-metrics — role-scoped revenue/lead/commission aggregate.
  getKeyMetrics({ query, authUser }) {
    const sp = this.#buildSearchParams({ query, authUser });
    return getKeyMetrics(sp, authUser.role);
  }

  // GET /leads-status — role-scoped lead-status breakdown (legacy also runs an ADMIN-only
  // commission recompute side-effect, gated on the TOKEN role — preserved).
  getLeadsStatus({ query, authUser }) {
    const sp = this.#buildSearchParams({ query, authUser });
    return getDashboardLeadStatusData(sp, authUser.role);
  }

  // GET /monthly-performance — 12-month lead/revenue trend, scoped to the caller (legacy
  // was NOT role-scoped → over-exposed; now auth-scoped via the effective staffId).
  getMonthlyPerformance({ query, authUser }) {
    const sp = this.#buildSearchParams({ query, authUser });
    return getMonthlyPerformanceData(sp);
  }

  // GET /emirates-analytics — per-emirate lead analytics, auth-scoped via effective staffId.
  getEmiratesAnalytics({ query, authUser }) {
    const sp = this.#buildSearchParams({ query, authUser });
    return getEmiratesAnalytics(sp);
  }

  // GET /leads-monthly-overview — inside/outside lead overview, auth-scoped via staffId.
  getLeadsMonthlyOverview({ query, authUser }) {
    const sp = this.#buildSearchParams({ query, authUser });
    return getLeadsMonthlyOverview(sp);
  }

  // GET /week-performance — weekly new/success/follow-up/meeting metrics, auth-scoped.
  getWeekPerformance({ query, authUser }) {
    const sp = this.#buildSearchParams({ query, authUser });
    return getPerformanceMetrics(sp);
  }

  // GET /latest-leads — the 5 newest NEW (unassigned) leads. Legacy takes NO args and
  // returns a GLOBAL list to every authed role; preserved 1:1 (this is the shared
  // new-lead pool, not a per-user metric). Flagged for documentation as legacy-preserved.
  getLatestLeads() {
    return getLatestNewLeads();
  }

  // GET /recent-activities — the caller's recent activity feed. Legacy keyed it off a
  // client `staffId` AND a client `userId` → cross-user read. Here: admin-tier may filter
  // by an actor `staffId` (or global); every other role is bound to their own userId.
  async getRecentActivities({ query, authUser }) {
    let scope;
    if (this.#isAdminTier(authUser)) {
      scope = query?.staffId ? { staffId: query.staffId } : {};
    } else {
      // self-scope. Coerce to a number so a non-numeric req.auth.id surfaces as an invalid
      // scope the repository will REJECT, instead of collapsing to the global feed.
      scope = { userId: Number(authUser.id) };
    }
    return dashboardRepository.recentActivities({ scope });
  }

  // GET /designer-metrics — per-designer project metrics. Legacy was NOT role-scoped and
  // keyed off a client staffId → a scoped designer could read another designer's metrics.
  // Now auth-scoped: admin-tier may pass a staffId (or global), everyone else is forced to
  // their own id.
  getDesignerMetrics({ query, authUser }) {
    const sp = this.#buildSearchParams({ query, authUser });
    return getDesignerMetrics(sp);
  }
}

export const dashboardUsecase = new DashboardUsecase();
export { DashboardUsecase };

import { PROFILES } from "@dms/shared";
// Dashboard analytics orchestration. Prisma stays in repositories/aggregations and
// request scope is derived from the authenticated user's active profile. Admin-tier
// profiles may select a staff filter; other profiles are forced to their own user ID.
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
class DashboardUsecase {
  // Admin-tier predicate — the legacy `isAdmin` union, read from the TOKEN (req.auth).
  #isAdminTier(authUser) {
    return Boolean(authUser?.isAdminTier) ||
      authUser?.currentProfileKey === PROFILES.SUPER_SALES;
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
    return getKeyMetrics(sp);
  }

  // GET /leads-status — role-scoped lead-status breakdown (legacy also runs an ADMIN-only
  // commission recompute side-effect, gated on the TOKEN role — preserved).
  getLeadsStatus({ query, authUser }) {
    const sp = this.#buildSearchParams({ query, authUser });
    return getDashboardLeadStatusData(sp, this.#isAdminTier(authUser));
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

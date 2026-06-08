// Dashboard data-access service — the ONLY place that talks to the dashboard API. Wraps the
// canonical apiFetch (config.apiUrl === /v2). Components/hooks call these helpers, never
// fetch/apiFetch directly. All responses share the { success, message, data, translationKey }
// envelope; helpers return the parsed envelope.
//
// All 9 reads are AUTHED (credentialed cookie auth) and gated server-side on dashboard.view.
// The shared metrics params { startDate, endDate, staffId, profile } are optional; `staffId`
// is honored ONLY for admin-tier callers (non-privileged roles are self-scoped by the BE).
// We NEVER send a `role` selector — the role comes from the token.

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  KEY_METRICS_URL,
  LEADS_STATUS_URL,
  MONTHLY_PERFORMANCE_URL,
  EMIRATES_ANALYTICS_URL,
  LEADS_MONTHLY_OVERVIEW_URL,
  WEEK_PERFORMANCE_URL,
  LATEST_LEADS_URL,
  RECENT_ACTIVITIES_URL,
  DESIGNER_METRICS_URL,
} from "./config/constant.js";

// Build a query string with top-level params (skips empty/null/undefined).
function buildQuery(base, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

export const dashboardService = {
  // GET /key-metrics            [dashboard.view]
  getKeyMetrics: (params = {}) => apiFetch.get(buildQuery(KEY_METRICS_URL, params)),
  // GET /leads-status           [dashboard.view]
  getLeadsStatus: (params = {}) => apiFetch.get(buildQuery(LEADS_STATUS_URL, params)),
  // GET /monthly-performance    [dashboard.view]
  getMonthlyPerformance: (params = {}) => apiFetch.get(buildQuery(MONTHLY_PERFORMANCE_URL, params)),
  // GET /emirates-analytics     [dashboard.view]
  getEmiratesAnalytics: (params = {}) => apiFetch.get(buildQuery(EMIRATES_ANALYTICS_URL, params)),
  // GET /leads-monthly-overview [dashboard.view]
  getLeadsMonthlyOverview: (params = {}) =>
    apiFetch.get(buildQuery(LEADS_MONTHLY_OVERVIEW_URL, params)),
  // GET /week-performance       [dashboard.view]
  getWeekPerformance: (params = {}) => apiFetch.get(buildQuery(WEEK_PERFORMANCE_URL, params)),
  // GET /latest-leads (no args) [dashboard.view]
  getLatestLeads: () => apiFetch.get(LATEST_LEADS_URL),
  // GET /recent-activities      [dashboard.view]
  getRecentActivities: (params = {}) => apiFetch.get(buildQuery(RECENT_ACTIVITIES_URL, params)),
  // GET /designer-metrics       [dashboard.view]
  getDesignerMetrics: (params = {}) => apiFetch.get(buildQuery(DESIGNER_METRICS_URL, params)),
};

export default dashboardService;

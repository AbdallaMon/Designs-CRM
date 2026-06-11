// Dashboard domain — API contract surface. All paths are relative to the v2 API base
// (apiFetch is configured with config.apiUrl === /v2). One place to edit if a backend path
// changes (reconciliation point vs server/src/modules/dashboard/dashboard.route.js).
//
// Backend contract (confirmed against dashboard.route.js):
//   AUTHED analytics surface, mounted at /v2/dashboard. Auth mounted ONCE at the router;
//   EVERY route declares the single DASHBOARD.VIEW permission code (`dashboard.view`,
//   granted to all 9 authed roles via SHARED_AUTHED). There is NO per-endpoint role split —
//   the per-request data SCOPE differs and is enforced server-side from req.auth (the IDOR
//   fix): admin-tier may pass an OPTIONAL `staffId`; every other role is forced to its own id.
//   A `?role=` query param is NOT consumed (the role comes from the token).
//
//   All 9 endpoints are GET and gated on [dashboard.view]:
//     GET /key-metrics            ?startDate=&endDate=&staffId=&profile=   → key metrics object
//     GET /leads-status           ?startDate=&endDate=&staffId=&profile=   → lead-status breakdown
//     GET /monthly-performance    ?startDate=&endDate=&staffId=&profile=   → monthly performance
//     GET /emirates-analytics     ?startDate=&endDate=&staffId=&profile=   → emirates analytics
//     GET /leads-monthly-overview ?startDate=&endDate=&staffId=&profile=   → leads monthly overview
//     GET /week-performance       ?startDate=&endDate=&staffId=&profile=   → week performance
//     GET /latest-leads                                                    → latest leads (no args)
//     GET /recent-activities      ?startDate=&endDate=&staffId=&profile=   → recent activities
//     GET /designer-metrics       ?startDate=&endDate=&staffId=&profile=   → designer metrics
//
// Query notes (per dashboard.validation.js):
//   • metricsQuery (.passthrough): { startDate?, endDate?, staffId?, profile? } — staffId is
//     honored ONLY for admin-tier; non-privileged roles are self-scoped server-side.
//   • latest-leads takes NO args (emptyQuery).

export const DASHBOARD_BASE = "dashboard";

export const KEY_METRICS_URL = `${DASHBOARD_BASE}/key-metrics`;
export const LEADS_STATUS_URL = `${DASHBOARD_BASE}/leads-status`;
export const MONTHLY_PERFORMANCE_URL = `${DASHBOARD_BASE}/monthly-performance`;
export const EMIRATES_ANALYTICS_URL = `${DASHBOARD_BASE}/emirates-analytics`;
export const LEADS_MONTHLY_OVERVIEW_URL = `${DASHBOARD_BASE}/leads-monthly-overview`;
export const WEEK_PERFORMANCE_URL = `${DASHBOARD_BASE}/week-performance`;
export const LATEST_LEADS_URL = `${DASHBOARD_BASE}/latest-leads`;
export const RECENT_ACTIVITIES_URL = `${DASHBOARD_BASE}/recent-activities`;
export const DESIGNER_METRICS_URL = `${DASHBOARD_BASE}/designer-metrics`;

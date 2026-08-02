// Single-language (Arabic) resolution for backend message CODES emitted by the dashboard
// domain API ({ success, message: CODE, translationKey: "dashboardMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/dashboard/dashboard.js); this is the
// FE lookup. Every code the dashboard surface can emit has an entry here; unknown codes fall
// back to a generic string. Mirrors features/calendar/config/calendarMessages.js.

export const dashboardMessages = {
  // ── reads (the 9 aggregations) ───────────────────────────────────────────────────
  KEY_METRICS_FETCHED: "Key metrics fetched",
  LEAD_STATUS_FETCHED: "Lead status fetched",
  MONTHLY_PERFORMANCE_FETCHED: "Monthly performance fetched",
  EMIRATES_ANALYTICS_FETCHED: "Emirates analytics fetched",
  LEADS_MONTHLY_OVERVIEW_FETCHED: "Monthly leads overview fetched",
  WEEK_PERFORMANCE_FETCHED: "Weekly performance fetched",
  LATEST_LEADS_FETCHED: "Latest leads fetched",
  RECENT_ACTIVITIES_FETCHED: "Recent activities fetched",
  DESIGNER_METRICS_FETCHED: "Designer metrics fetched",
  DASHBOARD_FETCH_FAILED: "Dashboard data could not be loaded",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "Operation completed successfully",
  FORBIDDEN: "You do not have permission to perform this action",
  ACCESS_DENIED: "You do not have access",
  VALIDATION_ERROR: "Invalid data",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveDashboardMessage(code, { fallback } = {}) {
  if (code && dashboardMessages[code]) return dashboardMessages[code];
  return fallback ?? "Operation completed";
}

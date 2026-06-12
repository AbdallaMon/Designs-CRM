// Single-language (Arabic) resolution for backend message CODES emitted by the dashboard
// domain API ({ success, message: CODE, translationKey: "dashboardMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/dashboard/dashboard.js); this is the
// FE lookup. Every code the dashboard surface can emit has an entry here; unknown codes fall
// back to a generic string. Mirrors features/calendar/config/calendarMessages.js.

export const dashboardMessages = {
  // ── reads (the 9 aggregations) ───────────────────────────────────────────────────
  KEY_METRICS_FETCHED: "تم جلب المؤشرات الرئيسية",
  LEAD_STATUS_FETCHED: "تم جلب حالة العملاء المحتملين",
  MONTHLY_PERFORMANCE_FETCHED: "تم جلب الأداء الشهري",
  EMIRATES_ANALYTICS_FETCHED: "تم جلب تحليلات الإمارات",
  LEADS_MONTHLY_OVERVIEW_FETCHED: "تم جلب نظرة شهرية على العملاء",
  WEEK_PERFORMANCE_FETCHED: "تم جلب أداء الأسبوع",
  LATEST_LEADS_FETCHED: "تم جلب أحدث العملاء المحتملين",
  RECENT_ACTIVITIES_FETCHED: "تم جلب آخر الأنشطة",
  DESIGNER_METRICS_FETCHED: "تم جلب مؤشرات المصممين",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "تمت العملية بنجاح",
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  ACCESS_DENIED: "لا تملك صلاحية الوصول",
  VALIDATION_ERROR: "بيانات غير صحيحة",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveDashboardMessage(code, { fallback } = {}) {
  if (code && dashboardMessages[code]) return dashboardMessages[code];
  return fallback ?? "تمت العملية";
}

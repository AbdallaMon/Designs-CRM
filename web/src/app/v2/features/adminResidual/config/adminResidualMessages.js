// Single-language (Arabic) resolution for backend message CODES emitted by the admin-residual
// domain API ({ success, message: CODE, translationKey: "adminResidualMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/admin-residual/admin-residual.js); this
// is the FE lookup. Every code the admin-residual surface can emit has an entry here; unknown
// codes fall back to a generic string. Mirrors features/calendar/config/calendarMessages.js.

export const adminResidualMessages = {
  // ── reports (🔒 frozen generators own the response body) ─────────────────────────
  LEAD_REPORT_GENERATED: "تم إنشاء تقرير العملاء المحتملين",
  STAFF_REPORT_GENERATED: "تم إنشاء تقرير الموظفين",

  // ── admin leads (import / create / update / delete) ──────────────────────────────
  LEADS_IMPORTED: "تم استيراد العملاء المحتملين",
  ADMIN_LEAD_CREATED: "تم إنشاء العميل المحتمل",
  ADMIN_LEAD_UPDATED: "تم تحديث العميل المحتمل",
  ADMIN_LEAD_DELETED: "تم حذف العميل المحتمل",
  ADMIN_CLIENT_UPDATED: "تم تحديث بيانات العميل",

  // ── telegram (lead-scoped) ───────────────────────────────────────────────────────
  TELEGRAM_CHANNEL_CREATED: "تم إنشاء قناة تيليجرام",
  TELEGRAM_USERS_QUEUED: "تم جدولة إضافة المستخدمين إلى تيليجرام",

  // ── fixed-data writes ────────────────────────────────────────────────────────────
  FIXED_DATA_CREATED: "تم إضافة البيان الثابت",
  FIXED_DATA_UPDATED: "تم تحديث البيان الثابت",
  FIXED_DATA_DELETED: "تم حذف البيان الثابت",

  // ── commissions ──────────────────────────────────────────────────────────────────
  COMMISSIONS_FETCHED: "تم جلب العمولات",
  COMMISSION_CREATED: "تم إضافة العمولة",
  COMMISSION_UPDATED: "تم تحديث العمولة",

  // ── admin projects ───────────────────────────────────────────────────────────────
  ADMIN_PROJECTS_FETCHED: "تم جلب المشاريع",
  PROJECT_GROUP_CREATED: "تم إنشاء مجموعة المشاريع",

  // ── model archive (allow-listed) ─────────────────────────────────────────────────
  MODEL_ARCHIVE_UPDATED: "تم تحديث حالة الأرشفة",

  // ── staff (the staff-tier residual read — included for completeness) ──────────────
  LATEST_CALLS_FETCHED: "تم جلب آخر المكالمات",

  // ── errors / domain rules ────────────────────────────────────────────────────────
  MODEL_NOT_ALLOWED: "هذا النموذج غير مسموح بأرشفته",
  COMMISSION_AMOUNT_INVALID: "قيمة العمولة غير صحيحة",
  COMMISSION_REASON_REQUIRED: "سبب العمولة مطلوب",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "تمت العملية بنجاح",
  CREATED: "تم الإنشاء بنجاح",
  UPDATED: "تم التحديث بنجاح",
  DELETED: "تم الحذف بنجاح",
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  ACCESS_DENIED: "لا تملك صلاحية الوصول",
  VALIDATION_ERROR: "بيانات غير صحيحة",
};

import { resolveMessageCode } from "@/app/v2/data/resolveMessageCode.js";

/**
 * Resolve a backend message CODE to an Arabic display string. Feature Arabic wins first;
 * unknown codes delegate to the CENTRAL resolver. `translationKey` routes the central lookup.
 * @param {string} code
 * @param {{ fallback?: string, translationKey?: string }} [opts]
 */
export function resolveAdminResidualMessage(code, { fallback, translationKey } = {}) {
  if (code && adminResidualMessages[code]) return adminResidualMessages[code];
  return resolveMessageCode(code, { translationKey, fallback });
}

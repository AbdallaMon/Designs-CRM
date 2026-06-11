// Central Arabic map for the ADMIN-RESIDUAL message CODES
// (packages/shared/messages-codes/admin-residual/admin-residual.js → adminResidualMessagesCodes).
// translationKey namespace: "adminResidualMessages". Harvested from
// features/adminResidual/config/adminResidualMessages.js. NOTE the BE keys/values use the
// ADMIN_* prefixed CODE STRINGS for the lead/client writes (key !== value in the BE file);
// the map is keyed by the CODE STRING the envelope actually carries. CODE → عربي.

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

  // ── staff ────────────────────────────────────────────────────────────────────────
  LATEST_CALLS_FETCHED: "تم جلب آخر المكالمات",

  // ── errors / domain rules ────────────────────────────────────────────────────────
  MODEL_NOT_ALLOWED: "هذا النموذج غير مسموح بأرشفته",
  COMMISSION_AMOUNT_INVALID: "قيمة العمولة غير صحيحة",
  COMMISSION_REASON_REQUIRED: "سبب العمولة مطلوب",
};

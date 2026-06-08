// Single-language (Arabic) resolution for backend message CODES emitted by the users
// surface ({ success, message: CODE, translationKey: "usersMessages" }) AND the staff
// residual read (translationKey: "adminResidualMessages"). The backend stays language-
// neutral (packages/shared/messages-codes/users/users.js + .../admin-residual/admin-residual.js);
// this is the FE lookup. Every code the users/staff surface can emit has an entry here;
// unknown codes fall back to a generic string. Mirrors features/calendar/config/calendarMessages.js.

export const usersMessages = {
  // ── users: reads ─────────────────────────────────────────────────────────────────
  USERS_FETCHED: "تم جلب المستخدمين",
  ALL_USERS_FETCHED: "تم جلب قائمة المستخدمين",
  USERS_DIRECTORY_FETCHED: "تم جلب دليل المستخدمين",
  USER_PROFILE_FETCHED: "تم جلب الملف الشخصي",
  USER_LOGS_FETCHED: "تم جلب السجلات",
  USER_LAST_SEEN_FETCHED: "تم جلب آخر نشاط",
  RESTRICTED_COUNTRIES_FETCHED: "تم جلب الدول المقيدة",
  AUTO_ASSIGNMENTS_FETCHED: "تم جلب التعيينات التلقائية",

  // ── users: mutations ───────────────────────────────────────────────────────────────
  USER_CREATED: "تم إنشاء المستخدم",
  USER_UPDATED: "تم تحديث المستخدم",
  USER_STATUS_TOGGLED: "تم تغيير حالة المستخدم",
  USER_STAFF_EXTRA_UPDATED: "تم تحديث بيانات الموظف",
  USER_ROLES_UPDATED: "تم تحديث الأدوار",
  USER_PROFILE_UPDATED: "تم تحديث الملف الشخصي",
  RESTRICTED_COUNTRIES_UPDATED: "تم تحديث الدول المقيدة",
  AUTO_ASSIGNMENTS_UPDATED: "تم تحديث التعيينات التلقائية",
  USER_MAX_LEADS_UPDATED: "تم تحديث الحد الأقصى للعملاء",
  USER_MAX_LEADS_PER_DAY_UPDATED: "تم تحديث الحد الأقصى اليومي للعملاء",
  USER_STAFF_EXTRA_FETCHED: "تم جلب بيانات الموظف",

  // ── users: errors / scope / guards ────────────────────────────────────────────────
  USER_NOT_FOUND: "المستخدم غير موجود",
  USER_PROFILE_NOT_FOUND: "الملف الشخصي غير موجود",
  USER_PROFILE_ACCESS_DENIED: "لا تملك صلاحية الوصول إلى هذا الملف الشخصي",
  USER_PROFILE_MUTATE_DENIED: "لا تملك صلاحية تعديل هذا الملف الشخصي",
  EMAIL_ALREADY_REGISTERED: "البريد الإلكتروني مسجل بالفعل",
  USER_NO_DATA_SENT: "لم يتم إرسال أي بيانات",
  USER_ROLE_NOT_ALLOWED: "هذا الدور غير مسموح به",

  // ── staff residual read (adminResidualMessages) ────────────────────────────────────
  LATEST_CALLS_FETCHED: "تم جلب آخر المكالمات",

  // ── generic envelope codes (shared core) ──────────────────────────────────────────
  OK: "تمت العملية بنجاح",
  CREATED: "تم الإنشاء بنجاح",
  UPDATED: "تم التحديث بنجاح",
  DELETED: "تم الحذف بنجاح",
  NOT_FOUND: "غير موجود",
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  UNAUTHORIZED: "يجب تسجيل الدخول",
  VALIDATION_ERROR: "بيانات غير صحيحة",
  CONFLICT: "تعارض في البيانات",
  INTERNAL_SERVER_ERROR: "حدث خطأ في الخادم",
  UNEXPECTED_ERROR: "حدث خطأ غير متوقع",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveUsersMessage(code, { fallback } = {}) {
  if (code && usersMessages[code]) return usersMessages[code];
  return fallback ?? "تمت العملية";
}

// Central Arabic map for the USERS message CODES
// (packages/shared/messages-codes/users/users.js → userMessagesCodes).
// translationKey namespace: "usersMessages". Harvested from
// features/users/config/usersMessages.js. CODE → عربي.

export const usersMessages = {
  // ── reads / generic ──────────────────────────────────────────────────────────
  USERS_FETCHED: "تم جلب المستخدمين",
  ALL_USERS_FETCHED: "تم جلب قائمة المستخدمين",
  USERS_DIRECTORY_FETCHED: "تم جلب دليل المستخدمين",
  USER_PROFILE_FETCHED: "تم جلب الملف الشخصي",
  USER_LOGS_FETCHED: "تم جلب السجلات",
  USER_LAST_SEEN_FETCHED: "تم جلب آخر نشاط",
  RESTRICTED_COUNTRIES_FETCHED: "تم جلب الدول المقيدة",
  AUTO_ASSIGNMENTS_FETCHED: "تم جلب التعيينات التلقائية",

  // ── success / mutations ──────────────────────────────────────────────────────
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

  // ── errors / scope / guards ──────────────────────────────────────────────────
  USER_NOT_FOUND: "المستخدم غير موجود",
  USER_PROFILE_NOT_FOUND: "الملف الشخصي غير موجود",
  USER_PROFILE_ACCESS_DENIED: "لا تملك صلاحية الوصول إلى هذا الملف الشخصي",
  USER_PROFILE_MUTATE_DENIED: "لا تملك صلاحية تعديل هذا الملف الشخصي",
  EMAIL_ALREADY_REGISTERED: "البريد الإلكتروني مسجل بالفعل",
  USER_NO_DATA_SENT: "لم يتم إرسال أي بيانات",
  USER_ROLE_NOT_ALLOWED: "هذا الدور غير مسموح به",
};

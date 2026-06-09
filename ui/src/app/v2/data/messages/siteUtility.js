// Central Arabic map for the SITE-UTILITY message CODES
// (packages/shared/messages-codes/site-utility/site-utility.js → siteUtilityMessagesCodes).
// translationKey namespace: "siteUtilityMessages". NOTE: the existing feature resolver
// (features/siteUtility/config/siteUtilityMessages.js) used a DIFFERENT key set
// (PDF_UTILITY_*, CONTRACT_PAYMENT_CONDITION_*) that does NOT match the BE code strings.
// This central map is keyed by the ACTUAL BE code strings; Arabic harvested by meaning.
// CODE → عربي.

export const siteUtilityMessages = {
  // ── reads ────────────────────────────────────────────────────────────────────
  PDF_CONFIG_FETCHED: "تم جلب إعدادات ملف الـ PDF",
  PAYMENT_CONDITIONS_FETCHED: "تم جلب شروط الدفع",

  // ── mutations ──────────────────────────────────────────────────────────────────
  PDF_CONFIG_UPDATED: "تم تحديث إعدادات ملف الـ PDF",
  PAYMENT_CONDITION_CREATED: "تم إنشاء شرط الدفع",
  PAYMENT_CONDITION_UPDATED: "تم تحديث شرط الدفع",
  PAYMENT_CONDITION_DELETED: "تم حذف شرط الدفع",

  // ── errors ───────────────────────────────────────────────────────────────────
  PAYMENT_CONDITION_NOT_FOUND: "شرط الدفع غير موجود",
  PAYMENT_CONDITION_RESERVED_VALUE: "لا يمكن إنشاء هذا الشرط المحجوز",
  PAYMENT_CONDITION_IN_USE: "لا يمكن حذف شرط دفع مرتبط بدفعات عقود",
};

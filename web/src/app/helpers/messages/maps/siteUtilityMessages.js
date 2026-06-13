// Single-language (Arabic) resolution for backend message CODES emitted by the
// site-utility API ({ success, message: CODE, translationKey }). The backend stays
// language-neutral; this is the FE lookup. Unknown codes fall back to a generic string.

export const siteUtilityMessages = {
  // pdf utility
  PDF_UTILITY_UPDATED: "تم تحديث إعدادات ملف الـ PDF",
  PDF_UTILITY_NOT_FOUND: "إعدادات ملف الـ PDF غير موجودة",
  // contract payment conditions
  CONTRACT_PAYMENT_CONDITION_CREATED: "تم إنشاء شرط الدفع",
  CONTRACT_PAYMENT_CONDITION_UPDATED: "تم تحديث شرط الدفع",
  CONTRACT_PAYMENT_CONDITION_DELETED: "تم حذف شرط الدفع",
  CONTRACT_PAYMENT_CONDITION_NOT_FOUND: "شرط الدفع غير موجود",
  CONTRACT_PAYMENT_CONDITION_ALREADY_EXISTS: "شرط الدفع موجود بالفعل",
  // generic
  OK: "تمت العملية بنجاح",
  CREATED: "تم الإنشاء بنجاح",
  UPDATED: "تم التحديث بنجاح",
  DELETED: "تم الحذف بنجاح",
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  ACCESS_DENIED: "لا تملك صلاحية الوصول",
  VALIDATION_ERROR: "بيانات غير صحيحة",
};

/**
 * Resolve a backend message CODE to an Arabic display string. Falls back to a sensible
 * default rather than showing the raw code to end users.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveSiteUtilityMessage(code, { fallback } = {}) {
  if (code && siteUtilityMessages[code]) return siteUtilityMessages[code];
  return fallback ?? "تمت العملية";
}

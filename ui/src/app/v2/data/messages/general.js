// Central Arabic map for the CORE / GENERAL message CODES
// (packages/shared/messages-codes/core/general.js → generalMessagesCodes).
// translationKey namespace: "generalMessages". These codes are returned EVERYWHERE
// (the error handler, response helpers, validation, file-upload guards) so every
// feature inherits them through the central resolver. CODE_STRING → النص العربي.
//
// Single-language Arabic. Mirrors the BE codes one-for-one; never put codes here that
// don't exist in the BE file, and ensure every BE general code has an entry.

export const generalMessages = {
  INTERNAL_SERVER_ERROR: "حدث خطأ في الخادم، حاول مرة أخرى لاحقاً",
  NOT_FOUND: "العنصر المطلوب غير موجود",
  VALIDATION_ERROR: "بيانات غير صحيحة، يرجى مراجعة الحقول",
  UNAUTHORIZED: "انتهت الجلسة، يرجى تسجيل الدخول من جديد",
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  BAD_REQUEST: "الطلب غير صحيح",
  CONFLICT: "تعارض في البيانات",
  TOO_MANY_REQUESTS: "محاولات كثيرة، يرجى المحاولة لاحقاً",
  SERVICE_UNAVAILABLE: "الخدمة غير متاحة حالياً، حاول لاحقاً",
  UNEXPECTED_ERROR: "حدث خطأ غير متوقع، حاول مرة أخرى",
  OK: "تمت العملية بنجاح",
  CREATED: "تم الإنشاء بنجاح",
  UPDATED: "تم التحديث بنجاح",
  DELETED: "تم الحذف بنجاح",
  FILE_UPLOAD_ERROR: "تعذّر رفع الملف، حاول مرة أخرى",
  FILE_TOO_LARGE: "حجم الملف كبير جداً",
  TOO_MANY_FILES: "عدد الملفات أكبر من المسموح",
  UNEXPECTED_FILE_FIELD: "حقل ملف غير متوقع",

  // ── universal client-side codes (no single BE domain) — network / unknown ──────
  // Emitted by the FE data layer itself (fetch failure, parse failure) — kept under
  // core so the central resolver always has an Arabic string for them.
  NETWORK_ERROR: "تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت",
  SERVER_ERROR: "حدث خطأ غير متوقع في الخادم",
  UNKNOWN_ERROR: "حدث خطأ ما، يرجى المحاولة مرة أخرى",
  RATE_LIMITED: "محاولات كثيرة، حاول لاحقاً",
};

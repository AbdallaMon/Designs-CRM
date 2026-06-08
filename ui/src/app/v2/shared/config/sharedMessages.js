// Cross-feature CODE → Arabic resolver for the SHARED state components (ErrorState/SuccessState).
// The backend stays language-neutral ({ success, message: CODE }); this is the FE lookup of last
// resort when a feature does not pass its own resolver. Per-feature resolvers (e.g.
// siteUtilityMessages) take precedence; this only covers generic envelope codes + common HTTP
// failure shapes. Single-language Arabic.

export const SHARED_MESSAGES = {
  OK: "تمت العملية بنجاح",
  CREATED: "تم الإنشاء بنجاح",
  UPDATED: "تم التحديث بنجاح",
  DELETED: "تم الحذف بنجاح",
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  ACCESS_DENIED: "لا تملك صلاحية الوصول",
  UNAUTHORIZED: "انتهت الجلسة، يرجى تسجيل الدخول من جديد",
  NOT_FOUND: "العنصر المطلوب غير موجود",
  VALIDATION_ERROR: "بيانات غير صحيحة",
  RATE_LIMITED: "محاولات كثيرة، حاول لاحقاً",
  NETWORK_ERROR: "تعذّر الاتصال بالخادم",
  SERVER_ERROR: "حدث خطأ غير متوقع في الخادم",
};

const DEFAULT_ERROR = "حدث خطأ ما، يرجى المحاولة مرة أخرى";

/**
 * Resolve a backend message CODE (or a raw error string) to an Arabic display string.
 * @param {string} code
 * @param {{ resolver?: Record<string,string>, fallback?: string }} [opts]
 *        resolver — a feature-specific CODE→Arabic map checked BEFORE the shared map.
 */
export function resolveSharedMessage(code, { resolver, fallback } = {}) {
  if (code && resolver && resolver[code]) return resolver[code];
  if (code && SHARED_MESSAGES[code]) return SHARED_MESSAGES[code];
  // If the value is already human Arabic text (not an ALL_CAPS code), show it as-is.
  if (code && !/^[A-Z0-9_]+$/.test(String(code))) return code;
  return fallback ?? DEFAULT_ERROR;
}

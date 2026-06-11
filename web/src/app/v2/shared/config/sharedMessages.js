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

import { resolveMessageCode } from "@/app/v2/data/resolveMessageCode.js";

const DEFAULT_ERROR = "حدث خطأ ما، يرجى المحاولة مرة أخرى";

/**
 * Resolve a backend message CODE (or a raw error string) to an Arabic display string.
 * A feature `resolver` and the small SHARED_MESSAGES map win first (legacy behavior); any
 * code they don't know delegates to the CENTRAL resolver — so cross-cutting core/auth/
 * validation/prisma codes and other-module codes resolve to Arabic instead of leaking the
 * raw code. `translationKey` (from the envelope) routes the central namespace lookup.
 * @param {string} code
 * @param {{ resolver?: Record<string,string>, fallback?: string, translationKey?: string }} [opts]
 *        resolver — a feature-specific CODE→Arabic map checked BEFORE the shared map.
 */
export function resolveSharedMessage(
  code,
  { resolver, fallback, translationKey, lang = "ar" } = {},
) {
  // A feature `resolver` always wins (it's caller-supplied; localize at the call site if needed).
  if (code && resolver && resolver[code]) return resolver[code];
  // The small Arabic SHARED_MESSAGES shortcut only applies for ar; for en we skip straight to the
  // central (language-aware) resolver so English codes get English wording.
  if (lang !== "en" && code && SHARED_MESSAGES[code]) return SHARED_MESSAGES[code];
  // Central, comprehensive backstop (namespace-scoped then flat; handles human-text
  // passthrough and never returns the raw code).
  return resolveMessageCode(code, {
    translationKey,
    lang,
    fallback: fallback ?? DEFAULT_ERROR,
  });
}

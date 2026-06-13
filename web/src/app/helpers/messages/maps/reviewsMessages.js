// Single-language (Arabic) resolution for backend message CODES emitted by the reviews domain
// API ({ success, message: CODE, translationKey: "reviewsMessages" }). The backend stays
// language-neutral (packages/shared/messages-codes/reviews/reviews.js); this is the FE lookup.
// Every code the reviews surface can emit has an entry here; unknown codes fall back to a
// generic string. Mirrors features/calendar/config/calendarMessages.js.

export const reviewsMessages = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  REVIEW_LOCATIONS_FETCHED: "تم جلب المواقع",
  REVIEWS_FETCHED: "تم جلب التقييمات",

  // ── oauth ─────────────────────────────────────────────────────────────────────────
  REVIEW_AUTH_URL_GENERATED: "تم إنشاء رابط الربط",
  REVIEW_OAUTH_CONNECTED: "تم ربط حساب جوجل للنشاط التجاري",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  REVIEW_OAUTH_MISSING_CODE: "رمز الربط مفقود",
  REVIEW_INTEGRATION_ERROR: "تعذر الاتصال بخدمة تقييمات جوجل",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "تمت العملية بنجاح",
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  ACCESS_DENIED: "لا تملك صلاحية الوصول",
  VALIDATION_ERROR: "بيانات غير صحيحة",
  NOT_FOUND: "العنصر غير موجود",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveReviewsMessage(code, { fallback } = {}) {
  if (code && reviewsMessages[code]) return reviewsMessages[code];
  return fallback ?? "تمت العملية";
}

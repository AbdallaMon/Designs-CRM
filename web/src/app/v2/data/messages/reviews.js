// Central Arabic map for the REVIEWS message CODES
// (packages/shared/messages-codes/reviews/reviews.js → reviewsMessagesCodes).
// translationKey namespace: "reviewsMessages". Harvested from
// features/reviews/config/reviewsMessages.js. CODE → عربي.

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
};

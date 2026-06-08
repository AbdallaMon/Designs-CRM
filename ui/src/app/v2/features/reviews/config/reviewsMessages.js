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

// ── UI strings (single-language Arabic) ─────────────────────────────────────────────
// Visible prose for the read-only reviews screen. The logic NEVER hard-codes Arabic; it
// reads from this map (mirrors the CODE→Arabic discipline for the rest of the surface). The
// Google connect is FROZEN / non-functional (stale dev redirect URI + empty creds), so the
// copy frames the whole surface as "غير مُفعّل" gracefully rather than as an error.
export const reviewsUi = {
  pageTitle: "تقييمات جوجل للنشاط التجاري",
  pageSubtitle: "عرض مواقع النشاط التجاري وتقييمات العملاء من Google Business Profile.",

  // connect (disabled / informational)
  connectTitle: "الربط مع Google",
  connectDisabledChip: "غير مُفعّل",
  connectExplanation:
    "الربط مع Google غير مُفعّل حالياً. لم تتم تهيئة تكامل حساب Google للنشاط التجاري على الخادم بعد، لذا لا يمكن جلب المواقع أو التقييمات. يتولى الخادم إدارة هذا الربط — تواصل مع المسؤول لتفعيله.",
  connectButton: "ربط مع Google",

  // location picker
  locationsTitle: "المواقع",
  locationPickerLabel: "اختر موقعاً",
  locationsEmptyTitle: "لا توجد مواقع متاحة",
  locationsEmptyDesc:
    "لم يتم إرجاع أي مواقع. غالباً لأن الربط مع Google غير مُفعّل بعد — بمجرد تفعيله من الخادم ستظهر مواقع النشاط التجاري هنا.",

  // reviews list
  reviewsTitle: "التقييمات",
  selectLocationPrompt: "اختر موقعاً من الأعلى لعرض تقييماته.",
  reviewsEmptyTitle: "لا توجد تقييمات",
  reviewsEmptyDesc: "لا توجد تقييمات لهذا الموقع حتى الآن.",
  reviewReplyLabel: "رد النشاط التجاري:",
  anonymousReviewer: "زائر",

  // errors (graceful, not scary)
  loadErrorTitle: "تعذّر تحميل بيانات التقييمات",
  notConfiguredError:
    "الربط مع Google غير مُفعّل، لذا لا يمكن جلب البيانات حالياً. هذه ليست مشكلة في النظام — التكامل بحاجة إلى تهيئة من الخادم.",

  // no access at all
  noAccessTitle: "تقييمات جوجل غير متاحة لصلاحياتك",
  noAccessMessage:
    "لا تملك صلاحية الوصول إلى تقييمات جوجل للنشاط التجاري. إن كنت تظن أنه ينبغي أن تصل إليها، تواصل مع المسؤول.",
};

// Google star-rating enum (returned by the Business API) → numeric stars. Used by the
// read-only review card to render a star row; UNSPECIFIED / unknown → 0.
export const STAR_RATING_VALUE = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

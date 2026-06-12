// Reviews domain — single-language (Arabic) labels + Google-shape mappers. The reviews
// surface passes RAW Google Business Profile objects straight through the behavior-frozen
// `services/reviews.js` (no BE dto remap), so every field accessor here is DEFENSIVE: the
// integration is non-functional today (stale placeholder OAuth client) and any field may be
// undefined. One place to edit if the Google shape changes (reconciliation point vs
// server/services/reviews.js getLocations/getReviews).
//
// Bound shapes (verified against services/reviews.js + reviews.usecase.test.js):
//   getLocations  → data: { accountId, locations: [ { name, title, storefrontAddress, ... } ] }
//                   `name` = "accounts/123/locations/9" ; `title` = display name.
//   getReviews    → data: [ { reviewId, reviewer: { displayName, profilePhotoUrl },
//                             starRating: "ONE".."FIVE", comment, createTime, updateTime,
//                             reviewReply?: { comment, updateTime } } ]

// Google `starRating` is an enum string; map to a 1..5 number for the star display.
export const STAR_RATING_VALUE = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

/** Enum/number/string star rating → integer 0..5 (0 = unknown). */
export function starRatingToNumber(rating) {
  if (typeof rating === "number") return Math.max(0, Math.min(5, Math.round(rating)));
  if (typeof rating === "string") {
    if (STAR_RATING_VALUE[rating]) return STAR_RATING_VALUE[rating];
    const n = Number(rating);
    if (!Number.isNaN(n)) return Math.max(0, Math.min(5, Math.round(n)));
  }
  return 0;
}

/**
 * Google location `name` is "accounts/{acc}/locations/{loc}" (or just "locations/{loc}" /
 * "{loc}"). The reviews read needs the bare `locations/{loc}` segment to build
 * `${accountId}/${locationId}` on the BE. Extract it defensively.
 */
export function extractLocationId(location = {}) {
  const name = location?.name;
  if (typeof name !== "string" || !name) return null;
  const match = name.match(/locations\/[^/]+/);
  if (match) return match[0];
  // already a bare id segment with no "accounts/" prefix
  return name.includes("/") ? null : `locations/${name}`;
}

/** Human display name for a location (title → name → fallback). */
export function locationTitle(location = {}, index = 0) {
  return location?.title || location?.locationName || location?.name || `موقع #${index + 1}`;
}

/** Flatten a Google `storefrontAddress` into a single Arabic-friendly line. */
export function locationAddress(location = {}) {
  const a = location?.storefrontAddress;
  if (!a) return "";
  const lines = Array.isArray(a.addressLines) ? a.addressLines : [];
  return [...lines, a.locality, a.administrativeArea, a.regionCode]
    .filter(Boolean)
    .join("، ");
}

/** Reviewer display name with an Arabic fallback for anonymous reviewers. */
export function reviewerName(review = {}) {
  return review?.reviewer?.displayName || "مستخدم مجهول";
}

export function reviewerPhoto(review = {}) {
  return review?.reviewer?.profilePhotoUrl || "";
}

/** Review body text (`comment`), or empty when the reviewer left only a rating. */
export function reviewComment(review = {}) {
  return review?.comment || "";
}

/** The studio's reply to a review, if present. */
export function reviewReply(review = {}) {
  const r = review?.reviewReply;
  if (!r || !r.comment) return null;
  return { comment: r.comment, updateTime: r.updateTime };
}

/** Format an RFC3339/ISO timestamp as an Arabic-locale date (defensive on bad input). */
export function formatReviewDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

// Static Arabic UI strings for the reviews screen (single place to edit copy).
export const reviewsLabels = {
  pageTitle: "تقييمات جوجل للنشاط التجاري",
  pageSubtitle: "المواقع المرتبطة بحساب جوجل للنشاط التجاري وتقييماتها.",

  // access / connection states
  noAccess: "لا تملك صلاحية الوصول إلى تقييمات جوجل",
  notConnectedTitle: "الحساب غير مربوط",
  notConnectedBody:
    "لم يتم ربط حساب جوجل للنشاط التجاري بعد، أو تعذّر جلب المواقع. يتم الربط عبر تدفّق المصادقة من جهة الخادم.",
  connectedChip: "مربوط",
  notConnectedChip: "غير مربوط",

  // locations panel
  locationsTitle: "المواقع",
  locationsEmpty: "لا توجد مواقع مرتبطة.",
  locationsError: "تعذّر جلب المواقع (قد لا يكون الحساب مربوطاً بعد).",
  selectLocationHint: "اختر موقعاً لعرض تقييماته.",

  // reviews panel
  reviewsTitle: "التقييمات",
  reviewsEmpty: "لا توجد تقييمات لهذا الموقع.",
  reviewsError: "تعذّر جلب التقييمات.",
  replyLabel: "ردّ النشاط التجاري",
  noComment: "(تقييم بدون نص)",

  // generic
  loading: "جاري التحميل...",
  refresh: "تحديث",
};

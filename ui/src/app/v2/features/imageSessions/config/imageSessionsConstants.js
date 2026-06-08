// Image-sessions domain constants — model-name allow-list + per-model shape readers (§5c #3),
// SessionStatus enum, and the admin reference-data type registry. Single source the service
// and screens import (no magic strings scattered in components).

// ── §5c #3: generic pick-list model names (GET /ids , GET /data) ────────────────────────
// The `model=` query MUST be one of the backend Prisma delegates (UTILITY_MODEL_ALLOWLIST in
// packages/shared/constants/access/permissions.constants.js). The legacy client UI referenced
// OLD/bogus names; map them to the REAL delegates here:
//   image       → designImage
//   pattern     → colorPattern
//   color       → colorPattern
//   imageSession→ (REMOVED — no longer a valid model; never request it)
// Relation-titled models (colorPattern/space/material/style) return `title` as a relation
// ARRAY of TextShort rows → read title[0].text. designImage → { id, imageUrl }. fixedData →
// { id, title } (scalar title). See UTILITY_MODEL_PROJECTIONS in the backend shared.
export const PICK_LIST_MODELS = Object.freeze({
  DESIGN_IMAGE: "designImage",
  COLOR_PATTERN: "colorPattern",
  SPACE: "space",
  MATERIAL: "material",
  STYLE: "style",
  FIXED_DATA: "fixedData",
});

// The complete set the backend accepts (rejects anything else with a 400). Mirrors
// UTILITY_MODEL_ALLOWLIST byte-for-byte.
export const PICK_LIST_MODEL_ALLOWLIST = Object.freeze([
  "designImage",
  "colorPattern",
  "space",
  "material",
  "style",
  "fixedData",
]);

// Legacy → real-delegate remap (apply before sending a `model=` query if porting old code
// that still uses the bogus names). `imageSession` is intentionally absent (removed).
export const LEGACY_MODEL_REMAP = Object.freeze({
  image: "designImage",
  pattern: "colorPattern",
  color: "colorPattern",
  designImage: "designImage",
  colorPattern: "colorPattern",
  space: "space",
  material: "material",
  style: "style",
  fixedData: "fixedData",
});

/** Normalize a (possibly legacy) model name to a valid backend delegate, or null if unknown. */
export function normalizePickListModel(model) {
  const mapped = LEGACY_MODEL_REMAP[model];
  return mapped && PICK_LIST_MODEL_ALLOWLIST.includes(mapped) ? mapped : null;
}

/**
 * Read the display label of a pick-list row given its model (§5c #3 shape readers).
 *  - designImage → imageUrl
 *  - fixedData   → title (scalar)
 *  - colorPattern/space/material/style → title[0].text (relation array)
 */
export function readPickListLabel(model, row) {
  if (!row) return "";
  if (model === PICK_LIST_MODELS.DESIGN_IMAGE) return row.imageUrl ?? "";
  if (model === PICK_LIST_MODELS.FIXED_DATA) return row.title ?? "";
  // relation-titled models: title is an array of { id, text }
  return Array.isArray(row.title) ? (row.title[0]?.text ?? "") : (row.title ?? "");
}

// ── SessionStatus enum — mirrors packages/db/prisma/schema.prisma (SessionStatus) and the
// backend client-image-session.validation.js SESSION_STATUS enum (byte-match). ─────────────
export const SESSION_STATUS = Object.freeze({
  INITIAL: "INITIAL",
  PREVIEW_COLOR_PATTERN: "PREVIEW_COLOR_PATTERN",
  SELECTED_COLOR_PATTERN: "SELECTED_COLOR_PATTERN",
  PREVIEW_MATERIAL: "PREVIEW_MATERIAL",
  SELECTED_MATERIAL: "SELECTED_MATERIAL",
  PREVIEW_STYLE: "PREVIEW_STYLE",
  SELECTED_STYLE: "SELECTED_STYLE",
  PREVIEW_IMAGES: "PREVIEW_IMAGES",
  SELECTED_IMAGES: "SELECTED_IMAGES",
  PDF_GENERATED: "PDF_GENERATED",
  SUBMITTED: "SUBMITTED",
});

// Arabic labels for the session status (single-language UI).
export const SESSION_STATUS_LABELS = Object.freeze({
  INITIAL: "البداية",
  PREVIEW_COLOR_PATTERN: "معاينة الألوان",
  SELECTED_COLOR_PATTERN: "تم اختيار الألوان",
  PREVIEW_MATERIAL: "معاينة الخامات",
  SELECTED_MATERIAL: "تم اختيار الخامات",
  PREVIEW_STYLE: "معاينة الطرز",
  SELECTED_STYLE: "تم اختيار الطرز",
  PREVIEW_IMAGES: "معاينة الصور",
  SELECTED_IMAGES: "تم اختيار الصور",
  PDF_GENERATED: "تم إنشاء الملف",
  SUBMITTED: "تم الإرسال",
});

// ── PUBLIC client step flow (status → { next, back }). Ported verbatim from the legacy
// client-session/helpers.js sessionStatusFlow — drives the public selection state machine. ──
export const SESSION_STATUS_FLOW = Object.freeze({
  INITIAL: { next: "PREVIEW_COLOR_PATTERN", back: null },
  PREVIEW_COLOR_PATTERN: { next: "SELECTED_COLOR_PATTERN", back: "INITIAL" },
  SELECTED_COLOR_PATTERN: { next: "PREVIEW_MATERIAL", back: "PREVIEW_COLOR_PATTERN" },
  PREVIEW_MATERIAL: { next: "SELECTED_MATERIAL", back: "SELECTED_COLOR_PATTERN" },
  SELECTED_MATERIAL: { next: "PREVIEW_STYLE", back: "PREVIEW_MATERIAL" },
  PREVIEW_STYLE: { next: "SELECTED_STYLE", back: "SELECTED_MATERIAL" },
  SELECTED_STYLE: { next: "PREVIEW_IMAGES", back: "PREVIEW_STYLE" },
  PREVIEW_IMAGES: { next: "SELECTED_IMAGES", back: "SELECTED_STYLE" },
  SELECTED_IMAGES: { next: "PDF_GENERATED", back: "PREVIEW_IMAGES" },
  PDF_GENERATED: { next: "SUBMITTED", back: "SELECTED_IMAGES" },
  SUBMITTED: { next: null, back: "PDF_GENERATED" },
});

// ── Admin reference-data type registry (one entry per AdminGallery tab). `slug` is the URL
// segment used by the service; `model` is the matching pick-list delegate; labels are Arabic.
export const ADMIN_REFERENCE_TYPES = Object.freeze([
  { key: "images", slug: "images", model: PICK_LIST_MODELS.DESIGN_IMAGE, label: "معرض الصور", paginated: true },
  { key: "pageInfo", slug: "page-info", model: null, label: "معلومات الصفحة", paginated: false },
  { key: "colors", slug: "colors", model: PICK_LIST_MODELS.COLOR_PATTERN, label: "الألوان والأنماط", paginated: false },
  { key: "spaces", slug: "space", model: PICK_LIST_MODELS.SPACE, label: "المساحات", paginated: false },
  { key: "materials", slug: "material", model: PICK_LIST_MODELS.MATERIAL, label: "الخامات", paginated: false },
  { key: "styles", slug: "style", model: PICK_LIST_MODELS.STYLE, label: "الطرز", paginated: false },
]);

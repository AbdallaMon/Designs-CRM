// Single-language (Arabic) resolution for backend message CODES emitted by the image-sessions
// domain API ({ success, message: CODE, translationKey: "imageSessionsMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/image-sessions/image-sessions.js);
// this is the FE lookup. Every code the three surfaces (admin + shared session + public client)
// can emit has an entry here; unknown codes fall back to a generic string. Mirrors
// features/contracts/config/contractsMessages.js. The BE REPLACED the legacy public-flow Arabic
// prose ("New session created", "Response saved", "Error in generating pdf") with these codes —
// resolved back to Arabic here.

export const imageSessionsMessages = {
  // ── ADMIN reference-data reads ──────────────────────────────────────────────────────
  IMAGE_SESSION_REFERENCE_FETCHED: "Data fetched",

  // ── ADMIN reference-data writes ─────────────────────────────────────────────────────
  IMAGE_SESSION_SPACE_CREATED: "Space added",
  IMAGE_SESSION_SPACE_UPDATED: "Space updated",
  IMAGE_SESSION_TEMPLATE_CREATED: "Template added",
  IMAGE_SESSION_TEMPLATE_UPDATED: "Template updated",
  IMAGE_SESSION_MATERIAL_CREATED: "Material added",
  IMAGE_SESSION_MATERIAL_UPDATED: "Material updated",
  IMAGE_SESSION_STYLE_CREATED: "Style added",
  IMAGE_SESSION_STYLE_UPDATED: "Style updated",
  IMAGE_SESSION_COLOR_CREATED: "Color added",
  IMAGE_SESSION_COLOR_UPDATED: "Color updated",
  IMAGE_SESSION_IMAGE_CREATED: "Image added",
  IMAGE_SESSION_IMAGE_UPDATED: "Image updated",
  IMAGE_SESSION_PAGE_INFO_CREATED: "Page info added",
  IMAGE_SESSION_PAGE_INFO_UPDATED: "Page info updated",
  IMAGE_SESSION_PRO_CON_CREATED: "Item added",
  IMAGE_SESSION_PRO_CON_UPDATED: "Item updated",
  IMAGE_SESSION_PRO_CON_DELETED: "Item deleted",
  IMAGE_SESSION_PRO_CON_REORDERED: "Items reordered",
  IMAGE_SESSION_PAGE_INFO_TYPE_EXISTS: "This page info type already exists",

  // ── SHARED session-management (lead-scoped) ─────────────────────────────────────────
  IMAGE_SESSIONS_FETCHED: "Sessions fetched",
  IMAGE_SESSION_CREATED: "Session created",
  IMAGE_SESSION_UPDATED: "Session updated",
  IMAGE_SESSION_TOKEN_REGENERATED: "Session link regenerated",
  IMAGE_SESSION_DELETED: "Session deleted",
  IMAGE_SESSION_MODEL_IDS_FETCHED: "List fetched",

  // ── PUBLIC client flow ──────────────────────────────────────────────────────────────
  IMAGE_SESSION_PAGE_INFO_FETCHED: "Page info fetched",
  IMAGE_SESSION_PROS_CONS_FETCHED: "Data fetched",
  IMAGE_SESSION_SESSION_FETCHED: "Session fetched",
  IMAGE_SESSION_STATUS_UPDATED: "Response saved successfully",
  IMAGE_SESSION_COLORS_FETCHED: "Colors fetched",
  IMAGE_SESSION_COLOR_SAVED: "Color saved",
  IMAGE_SESSION_MATERIALS_FETCHED: "Materials fetched",
  IMAGE_SESSION_MATERIAL_SAVED: "Materials saved",
  IMAGE_SESSION_STYLES_FETCHED: "Styles fetched",
  IMAGE_SESSION_STYLE_SAVED: "Style saved",
  IMAGE_SESSION_IMAGES_FETCHED: "Images fetched",
  IMAGE_SESSION_IMAGES_SAVED: "Images saved",
  IMAGE_SESSION_IMAGE_DELETED: "Image deleted",
  IMAGE_SESSION_PDF_GENERATED: "File generated successfully",
  IMAGE_SESSION_MODEL_FETCHED: "Data fetched",
  IMAGE_SESSION_PATTERNS_SAVED: "Patterns saved",
  IMAGE_SESSION_SELECTION_SAVED: "Selection saved",

  // ── errors / domain rules ───────────────────────────────────────────────────────────
  IMAGE_SESSION_NOT_FOUND: "Session not found",
  IMAGE_SESSION_TOKEN_INVALID: "Session link is invalid",
  IMAGE_SESSION_MODEL_NOT_ALLOWED: "Data type not allowed",
  IMAGE_SESSION_PDF_GENERATION_FAILED: "Failed to generate file",

  // ── generic envelope codes (shared) ─────────────────────────────────────────────────
  OK: "Operation completed successfully",
  CREATED: "Created successfully",
  UPDATED: "Updated successfully",
  DELETED: "Deleted successfully",
  FORBIDDEN: "You do not have permission to perform this action",
  ACCESS_DENIED: "You do not have access",
  VALIDATION_ERROR: "Invalid data",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveImageSessionMessage(code, { fallback } = {}) {
  if (code && imageSessionsMessages[code]) return imageSessionsMessages[code];
  return fallback ?? "Operation completed";
}

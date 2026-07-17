// Single-language (Arabic) resolution for backend message CODES emitted by the sales-stages
// domain API ({ success, message: CODE, translationKey: "salesStagesMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/sales-stages/sales-stages.js); this
// is the FE lookup. Every code the sales-stages surface can emit has an entry here; unknown
// codes fall back to a generic string. Mirrors features/calendar/config/calendarMessages.js.

export const salesStagesMessages = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  SALES_STAGES_FETCHED: "Sales stages fetched",

  // ── writes ───────────────────────────────────────────────────────────────────────
  SALES_STAGE_UPDATED: "Sales stage updated",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  SALES_STAGE_ACCESS_DENIED: "You do not have access to sales stages",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "Operation completed successfully",
  CREATED: "Created successfully",
  UPDATED: "Updated successfully",
  FORBIDDEN: "You do not have permission to perform this action",
  ACCESS_DENIED: "You do not have access",
  VALIDATION_ERROR: "Invalid data",
  NOT_FOUND: "Item not found",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveSalesStagesMessage(code, { fallback } = {}) {
  if (code && salesStagesMessages[code]) return salesStagesMessages[code];
  return fallback ?? "Operation completed";
}

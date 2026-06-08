// Single-language (Arabic) resolution for backend message CODES emitted by the sales-stages
// domain API ({ success, message: CODE, translationKey: "salesStagesMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/sales-stages/sales-stages.js); this
// is the FE lookup. Every code the sales-stages surface can emit has an entry here; unknown
// codes fall back to a generic string. Mirrors features/calendar/config/calendarMessages.js.

export const salesStagesMessages = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  SALES_STAGES_FETCHED: "تم جلب مراحل البيع",

  // ── writes ───────────────────────────────────────────────────────────────────────
  SALES_STAGE_UPDATED: "تم تحديث مرحلة البيع",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  SALES_STAGE_ACCESS_DENIED: "لا تملك صلاحية الوصول إلى مراحل البيع",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "تمت العملية بنجاح",
  CREATED: "تم الإنشاء بنجاح",
  UPDATED: "تم التحديث بنجاح",
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
export function resolveSalesStagesMessage(code, { fallback } = {}) {
  if (code && salesStagesMessages[code]) return salesStagesMessages[code];
  return fallback ?? "تمت العملية";
}

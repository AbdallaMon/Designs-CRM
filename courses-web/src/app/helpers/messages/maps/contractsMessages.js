// Single-language (Arabic) resolution for backend message CODES emitted by the contracts
// domain API ({ success, message: CODE, translationKey: "contractsMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/contracts/contracts.js); this is the
// FE lookup. Every code the contracts surface (authed + public e-sign) can emit has an entry
// here; unknown codes fall back to a generic string. Mirrors features/calendar/config/
// calendarMessages.js. The BE REPLACED the legacy Arabic prose ("تم حفظ الاستجابة بنجاح" etc.)
// with these codes — resolved back to Arabic here.

export const contractsMessages = {
  // ── authed reads ────────────────────────────────────────────────────────────────
  CONTRACTS_FETCHED: "Contracts fetched",
  CONTRACT_FETCHED: "Contract fetched",
  CONTRACT_PAYMENTS_FETCHED: "Payments fetched",

  // ── authed writes (contract lifecycle) ─────────────────────────────────────────────
  CONTRACT_CREATED: "Contract created",
  CONTRACT_UPDATED: "Contract updated",
  CONTRACT_CANCELLED: "Contract cancelled",
  CONTRACT_PDF_TOKEN_GENERATED: "Signing link created",

  // ── authed writes (stages) ─────────────────────────────────────────────────────────
  CONTRACT_STAGE_CREATED: "Stage added",
  CONTRACT_STAGE_UPDATED: "Stage updated",
  CONTRACT_STAGE_DELETED: "Stage deleted",

  // ── authed writes (payments) ───────────────────────────────────────────────────────
  CONTRACT_PAYMENT_CREATED: "Payment added",
  CONTRACT_PAYMENT_UPDATED: "Payment updated",
  CONTRACT_PAYMENT_DELETED: "Payment deleted",
  CONTRACT_PAYMENT_STATUS_UPDATED: "Payment status updated",
  CONTRACT_PAYMENT_AMOUNTS_UPDATED: "Payment amounts updated",

  // ── authed writes (drawings) ───────────────────────────────────────────────────────
  CONTRACT_DRAWING_CREATED: "Drawing added",
  CONTRACT_DRAWING_UPDATED: "Drawing updated",
  CONTRACT_DRAWING_DELETED: "Drawing deleted",

  // ── authed writes (special items) ──────────────────────────────────────────────────
  CONTRACT_SPECIAL_ITEM_CREATED: "Special item added",
  CONTRACT_SPECIAL_ITEM_UPDATED: "Special item updated",
  CONTRACT_SPECIAL_ITEM_DELETED: "Special item deleted",

  // ── public client e-sign surface ───────────────────────────────────────────────────
  CONTRACT_SESSION_FETCHED: "Contract data fetched",
  CONTRACT_SESSION_STATUS_UPDATED: "Response saved successfully",
  CONTRACT_PDF_GENERATED: "Contract signed successfully",

  // ── errors / domain rules ──────────────────────────────────────────────────────────
  CONTRACT_NOT_FOUND: "Contract not found",
  CONTRACT_SESSION_INVALID: "Invalid signing link",
  CONTRACT_PDF_GENERATION_FAILED: "Failed to generate contract file",

  // ── generic envelope codes (shared) ────────────────────────────────────────────────
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
export function resolveContractMessage(code, { fallback } = {}) {
  if (code && contractsMessages[code]) return contractsMessages[code];
  return fallback ?? "Operation completed";
}

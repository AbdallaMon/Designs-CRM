// Single-language (Arabic) resolution for backend message CODES emitted by the
// site-utility API ({ success, message: CODE, translationKey }). The backend stays
// language-neutral; this is the FE lookup. Unknown codes fall back to a generic string.

export const siteUtilityMessages = {
  // pdf utility
  PDF_UTILITY_UPDATED: "PDF file settings updated",
  PDF_UTILITY_NOT_FOUND: "PDF file settings not found",
  // contract payment conditions
  CONTRACT_PAYMENT_CONDITION_CREATED: "Payment condition created",
  CONTRACT_PAYMENT_CONDITION_UPDATED: "Payment condition updated",
  CONTRACT_PAYMENT_CONDITION_DELETED: "Payment condition deleted",
  CONTRACT_PAYMENT_CONDITION_NOT_FOUND: "Payment condition not found",
  CONTRACT_PAYMENT_CONDITION_ALREADY_EXISTS: "Payment condition already exists",
  // generic
  OK: "Operation completed successfully",
  CREATED: "Created successfully",
  UPDATED: "Updated successfully",
  DELETED: "Deleted successfully",
  FORBIDDEN: "You do not have permission to perform this action",
  ACCESS_DENIED: "You do not have access",
  VALIDATION_ERROR: "Invalid data",
};

/**
 * Resolve a backend message CODE to an Arabic display string. Falls back to a sensible
 * default rather than showing the raw code to end users.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveSiteUtilityMessage(code, { fallback } = {}) {
  if (code && siteUtilityMessages[code]) return siteUtilityMessages[code];
  return fallback ?? "Operation completed";
}

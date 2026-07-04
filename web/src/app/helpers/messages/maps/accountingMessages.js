// Single-language (Arabic) resolution for backend message CODES emitted by the accounting
// domain API ({ success, message: CODE, translationKey: "accountingMessages" }). The
// backend stays language-neutral (packages/shared/messages-codes/accounting/accounting.js);
// this is the FE lookup. Every code the accounting surface can emit has an entry here;
// unknown codes fall back to a generic string. Mirrors features/projects/config/projectsMessages.js.

export const accountingMessages = {
  // ── reads / generic ────────────────────────────────────────────────────────────
  PAYMENTS_FETCHED: "Payments fetched",
  PAYMENT_INVOICES_FETCHED: "Invoices fetched",
  NOTES_FETCHED: "Notes fetched",
  OPERATIONAL_EXPENSES_FETCHED: "Operational expenses fetched",
  RENTS_FETCHED: "Rents fetched",
  OUTCOMES_FETCHED: "Expenses fetched",
  SUMMARY_FETCHED: "Financial summary fetched",
  USERS_FETCHED: "Users fetched",
  USER_LAST_SEEN_FETCHED: "Activity log fetched",
  SALARY_DATA_FETCHED: "Salary data fetched",

  // ── success / mutations ──────────────────────────────────────────────────────────
  PAYMENT_PROCESSED: "Payment recorded",
  PAYMENT_MARKED_OVERDUE: "Payment marked as overdue",
  PAYMENT_LEVEL_CHANGED: "Payment level changed",
  NOTE_CREATED: "Note added",
  OPERATIONAL_EXPENSE_CREATED: "Operational expense added",
  RENT_CREATED: "Rent added",
  RENT_RENEWED: "Rent renewed",
  SALARY_CREATED: "Base salary created",
  SALARY_UPDATED: "Base salary updated",
  MONTHLY_SALARY_PAID: "Monthly salary paid",

  // ── errors / scope / domain rules (preserved from legacy services) ───────────────
  PAYMENT_NOT_FOUND: "Payment not found",
  PAYMENT_ALREADY_FULLY_PAID: "This payment has already been fully paid",
  PAYMENT_AMOUNT_EXCEEDS_PENDING: "The entered amount exceeds the remaining balance",
  PAYMENT_AMOUNT_INVALID: "Invalid amount",
  PAYMENT_DATE_REQUIRED: "Payment date is required",
  RENT_NOT_FOUND: "Rent not found",
  MONTHLY_SALARY_ALREADY_EXISTS: "This month's salary has already been paid",
  REQUIRED_FIELDS_MISSING: "Please fill in all required fields",
  ACCOUNTING_ACCESS_DENIED: "You do not have access to this section",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
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
export function resolveAccountingMessage(code, { fallback } = {}) {
  if (code && accountingMessages[code]) return accountingMessages[code];
  return fallback ?? "Operation completed";
}

// English mirror of the ACCOUNTING message CODES (namespace "accountingMessages").
// CODE → English. Mirrors keys 1:1 with ../accounting.js (the Arabic map). Bilingual Phase 1.

export const accountingMessagesEn = {
  // ── reads / generic ────────────────────────────────────────────────────────────
  PAYMENTS_FETCHED: "Payments retrieved",
  PAYMENT_INVOICES_FETCHED: "Invoices retrieved",
  NOTES_FETCHED: "Notes retrieved",
  OPERATIONAL_EXPENSES_FETCHED: "Operational expenses retrieved",
  RENTS_FETCHED: "Rents retrieved",
  OUTCOMES_FETCHED: "Expenses retrieved",
  SUMMARY_FETCHED: "Financial summary retrieved",
  USERS_FETCHED: "Users retrieved",
  USER_LAST_SEEN_FETCHED: "Activity log retrieved",
  SALARY_DATA_FETCHED: "Salary data retrieved",

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

  // ── errors / scope / domain rules ────────────────────────────────────────────────
  PAYMENT_NOT_FOUND: "Payment not found",
  PAYMENT_ALREADY_FULLY_PAID: "This payment has already been fully paid",
  PAYMENT_AMOUNT_EXCEEDS_PENDING: "The entered amount exceeds the remaining balance",
  PAYMENT_AMOUNT_INVALID: "Invalid amount",
  PAYMENT_DATE_REQUIRED: "Payment date is required",
  RENT_NOT_FOUND: "Rent not found",
  MONTHLY_SALARY_ALREADY_EXISTS: "This month's salary has already been paid",
  REQUIRED_FIELDS_MISSING: "Please fill in all required fields",
  ACCOUNTING_ACCESS_DENIED: "You don't have permission to access this section",
};

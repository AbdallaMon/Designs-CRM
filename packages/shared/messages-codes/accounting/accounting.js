// accounting module message CODES. SCREAMING_SNAKE_CASE, key === value (the string
// IS the code). Carried in the API envelope `message` field; the client resolves
// (translationKey: accountingMessages, code) → displayed string. Language-neutral —
// never put Arabic/English prose here.
//
// This is a MONEY-sensitive module (payments, salaries, expenses, rents). Every
// state-changing financial action returns a distinct success code; domain-rule
// failures preserved from the legacy accountant services map to the *_ERROR codes.
export const accountingMessagesCodes = {
  // ── reads / generic ──────────────────────────────────────────────────────────
  PAYMENTS_FETCHED: "PAYMENTS_FETCHED",
  PAYMENT_INVOICES_FETCHED: "PAYMENT_INVOICES_FETCHED",
  NOTES_FETCHED: "NOTES_FETCHED",
  OPERATIONAL_EXPENSES_FETCHED: "OPERATIONAL_EXPENSES_FETCHED",
  RENTS_FETCHED: "RENTS_FETCHED",
  OUTCOMES_FETCHED: "OUTCOMES_FETCHED",
  SUMMARY_FETCHED: "SUMMARY_FETCHED",
  USERS_FETCHED: "USERS_FETCHED",
  USER_LAST_SEEN_FETCHED: "USER_LAST_SEEN_FETCHED",
  SALARY_DATA_FETCHED: "SALARY_DATA_FETCHED",

  // ── success / mutations ──────────────────────────────────────────────────────
  PAYMENT_PROCESSED: "PAYMENT_PROCESSED", // POST /payments/:id/actions/pay
  PAYMENT_MARKED_OVERDUE: "PAYMENT_MARKED_OVERDUE", // POST /payments/:id/actions/mark-overdue
  PAYMENT_LEVEL_CHANGED: "PAYMENT_LEVEL_CHANGED", // POST /payments/:id/actions/change-status
  NOTE_CREATED: "NOTE_CREATED",
  OPERATIONAL_EXPENSE_CREATED: "OPERATIONAL_EXPENSE_CREATED",
  RENT_CREATED: "RENT_CREATED",
  RENT_RENEWED: "RENT_RENEWED", // PUT /rents/:rentId (renew + outcome)
  SALARY_CREATED: "SALARY_CREATED",
  SALARY_UPDATED: "SALARY_UPDATED",
  MONTHLY_SALARY_PAID: "MONTHLY_SALARY_PAID",

  // ── errors / scope / domain rules (preserved from legacy services) ────────────
  PAYMENT_NOT_FOUND: "PAYMENT_NOT_FOUND",
  PAYMENT_ALREADY_FULLY_PAID: "PAYMENT_ALREADY_FULLY_PAID",
  PAYMENT_AMOUNT_EXCEEDS_PENDING: "PAYMENT_AMOUNT_EXCEEDS_PENDING",
  PAYMENT_AMOUNT_INVALID: "PAYMENT_AMOUNT_INVALID", // amount <= 0 / NaN
  PAYMENT_DATE_REQUIRED: "PAYMENT_DATE_REQUIRED",
  RENT_NOT_FOUND: "RENT_NOT_FOUND",
  MONTHLY_SALARY_ALREADY_EXISTS: "MONTHLY_SALARY_ALREADY_EXISTS",
  REQUIRED_FIELDS_MISSING: "REQUIRED_FIELDS_MISSING",
  ACCOUNTING_ACCESS_DENIED: "ACCOUNTING_ACCESS_DENIED",
};

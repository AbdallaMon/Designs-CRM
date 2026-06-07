// Accounting domain — API contract surface. All paths are relative to the v2 API base
// (apiFetch is configured with config.apiUrl === /v2). One place to edit if a backend
// path changes (reconciliation point vs server/src/modules/accounting/*/*.routes.js).
//
// Backend contract (confirmed against the v2 route files under
// server/src/modules/accounting/{payment,expense,note,rent,salary,report}/*.routes.js):
//   /v2/accounting/payments:
//     GET  /                                   → payments list ({ items,total,page,pageSize } + capabilities.*)
//     GET  /:paymentId/invoices                → invoices of a payment ({ items })
//     POST /:paymentId/actions/pay             → process a payment  (§5c rename; was POST .../pay/:id)
//     POST /:paymentId/actions/mark-overdue    → mark overdue       (§5c rename; was POST .../overdue/:id)
//     POST /:paymentId/actions/change-status   → change level       (§5c rename; was PUT  .../status/:id;
//                                                 oldPaymentLevel DROPPED — server derives it)
//   /v2/accounting/notes:
//     GET  /?idKey=&id=                         → notes attached to an owner ({ items })
//     POST /                                    → add a note (body { content, attachment?, idKey, id })
//   /v2/accounting/operational-expenses:
//     GET  /                                    → expenses list ({ items,total,page,pageSize })
//     POST /                                    → create an expense
//   /v2/accounting/rents:
//     GET  /                                    → rents list ({ items,total,page,pageSize } + capabilities.*)
//     POST /                                    → create a rent (+ first period + outcome)
//     PUT  /:rentId                             → renew a rent (+ period + outcome)
//   /v2/accounting/outcome:
//     GET  /                                    → outcome list ({ items,total,page,pageSize })
//   /v2/accounting/summary:
//     GET  /                                    → income/outcome summary (object)
//   /v2/accounting/users:
//     GET  /                                    → users-with-salaries list ({ items,total,page,pageSize })
//     GET  /:userId/last-seen                   → a user's monthly activity log
//   /v2/accounting/salaries:
//     GET  /data?userId=&startDate=&endDate=    → one user's base + monthly salary data (object)
//     POST /:userId                             → create base salary
//     PUT  /:id                                 → edit base salary
//     POST /monthly/pay                         → pay a monthly salary (+ outcome)

export const ACCOUNTING_BASE = "accounting";

// ── payments ────────────────────────────────────────────────────────────────────────
export const PAYMENTS_URL = `${ACCOUNTING_BASE}/payments`;
export const paymentInvoicesUrl = (paymentId) => `${PAYMENTS_URL}/${paymentId}/invoices`;
// workflow actions (POST) — §5c renames
export const paymentPayUrl = (paymentId) => `${PAYMENTS_URL}/${paymentId}/actions/pay`;
export const paymentMarkOverdueUrl = (paymentId) =>
  `${PAYMENTS_URL}/${paymentId}/actions/mark-overdue`;
export const paymentChangeStatusUrl = (paymentId) =>
  `${PAYMENTS_URL}/${paymentId}/actions/change-status`;

// ── notes ─────────────────────────────────────────────────────────────────────────
export const NOTES_URL = `${ACCOUNTING_BASE}/notes`;

// ── operational expenses ────────────────────────────────────────────────────────────
export const EXPENSES_URL = `${ACCOUNTING_BASE}/operational-expenses`;

// ── rents ───────────────────────────────────────────────────────────────────────────
export const RENTS_URL = `${ACCOUNTING_BASE}/rents`;
export const rentUrl = (rentId) => `${RENTS_URL}/${rentId}`;

// ── outcome / summary ───────────────────────────────────────────────────────────────
export const OUTCOME_URL = `${ACCOUNTING_BASE}/outcome`;
export const SUMMARY_URL = `${ACCOUNTING_BASE}/summary`;

// ── accountant-scoped user helper lists (for salaries) ──────────────────────────────
export const ACCOUNTING_USERS_URL = `${ACCOUNTING_BASE}/users`;
export const userLastSeenUrl = (userId) => `${ACCOUNTING_USERS_URL}/${userId}/last-seen`;

// ── salaries ────────────────────────────────────────────────────────────────────────
export const SALARIES_URL = `${ACCOUNTING_BASE}/salaries`;
export const SALARY_DATA_URL = `${SALARIES_URL}/data`;
export const SALARY_MONTHLY_PAY_URL = `${SALARIES_URL}/monthly/pay`;
export const salaryCreateUrl = (userId) => `${SALARIES_URL}/${userId}`;
export const salaryEditUrl = (id) => `${SALARIES_URL}/${id}`;

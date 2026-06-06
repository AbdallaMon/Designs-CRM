// Site-utility feature — API contract surface. All paths are relative to the v2 API
// base (apiFetch is configured with config.apiUrl === /v2). Keep these in one place so a
// backend path change is a one-line edit (reconciliation point vs the site-utility module).
//
// Target backend contract (all under /v2/site-utilities):
//   GET  /pdf-utility                          → singleton config object
//   POST /pdf-utility                          → upsert
//   GET  /contract-payment-conditions          → list ({ items, total, page, pageSize })
//   POST /contract-payment-conditions          → create
//   PUT  /contract-payment-conditions/:id      → update
//   DELETE /contract-payment-conditions/:id    → delete

export const SITE_UTILITY_BASE = "site-utilities";

// ── PDF utility (singleton) ──────────────────────────────────────────────────
export const PDF_UTILITY_URL = `${SITE_UTILITY_BASE}/pdf-utility`;

// ── Contract payment conditions (CRUD) ───────────────────────────────────────
export const CONTRACT_PAYMENT_CONDITIONS_URL = `${SITE_UTILITY_BASE}/contract-payment-conditions`;
export const contractPaymentConditionUrl = (id) =>
  `${SITE_UTILITY_BASE}/contract-payment-conditions/${id}`;

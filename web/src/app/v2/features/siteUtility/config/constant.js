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

// ── Contract utility editor (obligations + stage/special/level clause templates) ──
// Backend contract (all under /v2/site-utilities/contract-utility):
//   GET  /details                            → { utility, stageClauses, specialClauses, levelClauses, capabilities }
//   GET|POST|PUT /obligations                → the ContractUtility singleton (AR/EN)
//   GET|POST /stage-clauses ; PUT|DELETE /stage-clauses/:clauseId
//   GET|POST /special-clauses ; PUT|DELETE /special-clauses/:clauseId
//   GET|POST /level-clauses ; PUT|DELETE /level-clauses/:clauseId
export const CONTRACT_UTILITY_BASE = `${SITE_UTILITY_BASE}/contract-utility`;
export const CONTRACT_UTILITY_DETAILS_URL = `${CONTRACT_UTILITY_BASE}/details`;
export const CONTRACT_UTILITY_OBLIGATIONS_URL = `${CONTRACT_UTILITY_BASE}/obligations`;
export const CONTRACT_UTILITY_STAGE_CLAUSES_URL = `${CONTRACT_UTILITY_BASE}/stage-clauses`;
export const contractUtilityStageClauseUrl = (id) =>
  `${CONTRACT_UTILITY_BASE}/stage-clauses/${id}`;
export const CONTRACT_UTILITY_SPECIAL_CLAUSES_URL = `${CONTRACT_UTILITY_BASE}/special-clauses`;
export const contractUtilitySpecialClauseUrl = (id) =>
  `${CONTRACT_UTILITY_BASE}/special-clauses/${id}`;
export const CONTRACT_UTILITY_LEVEL_CLAUSES_URL = `${CONTRACT_UTILITY_BASE}/level-clauses`;
export const contractUtilityLevelClauseUrl = (id) =>
  `${CONTRACT_UTILITY_BASE}/level-clauses/${id}`;

// ContractLevel enum (FROZEN — schema.prisma). The level-clause select offers these.
export const CONTRACT_LEVELS = [
  "LEVEL_1",
  "LEVEL_2",
  "LEVEL_3",
  "LEVEL_4",
  "LEVEL_5",
  "LEVEL_6",
  "LEVEL_7",
];

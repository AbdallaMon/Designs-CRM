// sales-stages module message CODES. SCREAMING_SNAKE_CASE, key === value (the string
// IS the code). Carried in the API envelope `message` field; the client resolves
// (translationKey: salesStagesMessages, code) → displayed string. Language-neutral —
// never put Arabic/English prose here.
//
// Covers the per-lead sales-pipeline stage progression surface (legacy
// `/shared/sales-stages/*`). SalesStage rows are lead-scoped; the v2 module reuses the
// leads-module object-scope checker on the parent lead (the IDOR fix). The stage change
// is a workflow action; the acting user is derived from req.auth, never the body.
export const salesStagesMessagesCodes = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  SALES_STAGES_FETCHED: "SALES_STAGES_FETCHED",

  // ── writes ───────────────────────────────────────────────────────────────────────
  SALES_STAGE_UPDATED: "SALES_STAGE_UPDATED",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  SALES_STAGE_ACCESS_DENIED: "SALES_STAGE_ACCESS_DENIED",
};

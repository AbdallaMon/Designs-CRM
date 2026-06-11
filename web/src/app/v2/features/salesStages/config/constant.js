// Sales-stages domain — API contract surface. All paths are RELATIVE to the v2 API base
// (apiFetch is configured with config.apiUrl === /v2; do NOT prefix with /v2 here). One
// place to edit if a backend path changes (reconciliation point vs
// server/src/modules/sales-stages/sales-stages.route.js).
//
// SCOPE: the per-lead sales-pipeline stage progression surface (legacy `/shared/sales-stages/*`,
// now `/v2/sales-stages/*`). SalesStage rows are LEAD-SCOPED; the BE resolves + checks the
// parent lead via the leads-module object-scope checker before any read/write (the IDOR fix).
// The dto emits NO capabilities.* — gate authed actions on the SALES_STAGE.* CODES only; the
// server enforces the lead scope and derives the acting user from req.auth (never the body).
//
// §5c RENAME: the legacy stage change was a generic `POST /:clientLeadId`. v2 makes it a
// dedicated workflow action endpoint (`POST /:clientLeadId/actions/set-stage`) per the
// no-generic-mutation-on-status rule.
//
// Backend contract (confirmed against sales-stages.route.js / sales-stages.validation.js):
//   GET  /:clientLeadId                      → the lead's sales stages (lead-scoped read)   [sales_stage.view]
//   POST /:clientLeadId/actions/set-stage    → advance / roll back the lead's stage         [sales_stage.manage]
//        body (.strict): advance → { nextStage: { key } }
//                        roll-back → { action: "back", currentStageType | curentStageType }
//        (`curentStageType` is the legacy misspelling, accepted by the BE for 1:1 compat)
//
// STAGE_KEYS — the SalesStageType enum + the virtual NOT_INITIATED sentinel (the BE skips
// persistence for the sentinel; it is NOT a real row).

export const SALES_STAGES_BASE = "sales-stages";

export const salesStagesUrl = (clientLeadId) => `${SALES_STAGES_BASE}/${clientLeadId}`;
export const setStageUrl = (clientLeadId) =>
  `${SALES_STAGES_BASE}/${clientLeadId}/actions/set-stage`;

export const SALES_STAGE_TYPES = [
  "INITIAL_CONTACT",
  "SOCIAL_MEDIA_CHECK",
  "WHATSAPP_QA",
  "MEETING_BOOKED",
  "CLIENT_INFO_UPLOADED",
  "CONSULTATION_BOOKED",
  "FOLLOWUP_AFTER_MEETING",
  "HANDLE_OBJECTIONS",
  "DEAL_CLOSED",
  "AFTER_SALES_FOLLOWUP",
];

// The virtual not-initiated sentinel used for the first/last hop (NOT a persisted row).
export const STAGE_KEYS = [...SALES_STAGE_TYPES, "NOT_INITIATED"];

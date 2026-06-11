// Sales-stages data-access service — the ONLY place that talks to the sales-stages API. Wraps
// the canonical apiFetch (config.apiUrl === /v2). Components/hooks call these helpers, never
// fetch/apiFetch directly. All responses share the { success, message, data, translationKey }
// envelope; helpers return the parsed envelope.
//
// One AUTHED staff surface (apiFetch.* — credentialed, cookie auth) at /v2/sales-stages. The
// read + the set-stage workflow action are LEAD-SCOPED: the clientLeadId is part of the path;
// the BE runs the leads-module object-scope checker on the parent lead before any read/write
// (the IDOR fix). The dto emits NO capabilities.* — gate authed actions on the SALES_STAGE.*
// CODES; the server enforces the lead scope and derives the acting user from req.auth.
//
// The set-stage body is built to match the BE .strict() schema exactly (advance OR roll-back;
// no extra keys — .strict() would 422 on unknowns). See config/constant.js for the contract.

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import { salesStagesUrl, setStageUrl } from "./config/constant.js";

export const salesStagesService = {
  // GET /:clientLeadId → the lead's sales stages (lead-scoped read)   [sales_stage.view]
  getStages: (clientLeadId) => apiFetch.get(salesStagesUrl(clientLeadId)),

  // POST /:clientLeadId/actions/set-stage — ADVANCE to nextStage.key   [sales_stage.manage]
  // body (.strict): { nextStage: { key } }
  advanceStage: (clientLeadId, { key }) =>
    apiFetch.post(setStageUrl(clientLeadId), { nextStage: { key } }),

  // POST /:clientLeadId/actions/set-stage — ROLL BACK   [sales_stage.manage]
  // body (.strict): { action: "back", currentStageType }
  rollBackStage: (clientLeadId, { currentStageType }) =>
    apiFetch.post(setStageUrl(clientLeadId), { action: "back", currentStageType }),
};

export default salesStagesService;

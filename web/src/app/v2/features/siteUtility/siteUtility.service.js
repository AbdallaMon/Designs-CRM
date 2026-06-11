// Site-utility data-access service — the ONLY place that talks to the site-utility API.
// Wraps the canonical apiFetch (config.apiUrl === /v2). Components/hooks call these,
// never fetch/apiFetch directly. All responses share the { success, message, data,
// translationKey } envelope; helpers return the parsed envelope.

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  PDF_UTILITY_URL,
  CONTRACT_PAYMENT_CONDITIONS_URL,
  contractPaymentConditionUrl,
  CONTRACT_UTILITY_DETAILS_URL,
  CONTRACT_UTILITY_OBLIGATIONS_URL,
  CONTRACT_UTILITY_STAGE_CLAUSES_URL,
  contractUtilityStageClauseUrl,
  CONTRACT_UTILITY_SPECIAL_CLAUSES_URL,
  contractUtilitySpecialClauseUrl,
  CONTRACT_UTILITY_LEVEL_CLAUSES_URL,
  contractUtilityLevelClauseUrl,
} from "./config/constant.js";

function withQuery(base, params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return base;
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return base.includes("?") ? `${base}&${qs}` : `${base}?${qs}`;
}

export const siteUtilityService = {
  // ── PDF utility (singleton) ──────────────────────────────────────────────
  getPdfUtility: () => apiFetch.get(PDF_UTILITY_URL),
  upsertPdfUtility: (body) => apiFetch.post(PDF_UTILITY_URL, body),

  // ── Contract payment conditions (CRUD) ───────────────────────────────────
  listContractPaymentConditions: (params = {}) =>
    apiFetch.get(withQuery(CONTRACT_PAYMENT_CONDITIONS_URL, params)),
  createContractPaymentCondition: (body) =>
    apiFetch.post(CONTRACT_PAYMENT_CONDITIONS_URL, body),
  updateContractPaymentCondition: (id, body) =>
    apiFetch.put(contractPaymentConditionUrl(id), body),
  deleteContractPaymentCondition: (id) =>
    apiFetch.delete(contractPaymentConditionUrl(id)),

  // ── Contract utility editor (obligations + stage/special/level clauses) ────
  getContractUtilityDetails: () => apiFetch.get(CONTRACT_UTILITY_DETAILS_URL),

  // Obligations (ContractUtility singleton). The backend upserts on PUT.
  saveContractObligations: (body) =>
    apiFetch.put(CONTRACT_UTILITY_OBLIGATIONS_URL, body),

  // Stage clauses
  createStageClause: (body) =>
    apiFetch.post(CONTRACT_UTILITY_STAGE_CLAUSES_URL, body),
  updateStageClause: (id, body) =>
    apiFetch.put(contractUtilityStageClauseUrl(id), body),
  deleteStageClause: (id) =>
    apiFetch.delete(contractUtilityStageClauseUrl(id)),

  // Special clauses
  createSpecialClause: (body) =>
    apiFetch.post(CONTRACT_UTILITY_SPECIAL_CLAUSES_URL, body),
  updateSpecialClause: (id, body) =>
    apiFetch.put(contractUtilitySpecialClauseUrl(id), body),
  deleteSpecialClause: (id) =>
    apiFetch.delete(contractUtilitySpecialClauseUrl(id)),

  // Level clauses
  createLevelClause: (body) =>
    apiFetch.post(CONTRACT_UTILITY_LEVEL_CLAUSES_URL, body),
  updateLevelClause: (id, body) =>
    apiFetch.put(contractUtilityLevelClauseUrl(id), body),
  deleteLevelClause: (id) =>
    apiFetch.delete(contractUtilityLevelClauseUrl(id)),
};

export default siteUtilityService;

// Site-utility data-access service — the ONLY place that talks to the site-utility API.
// Wraps the canonical apiFetch (config.apiUrl === /v2). Components/hooks call these,
// never fetch/apiFetch directly. All responses share the { success, message, data,
// translationKey } envelope; helpers return the parsed envelope.

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  PDF_UTILITY_URL,
  CONTRACT_PAYMENT_CONDITIONS_URL,
  contractPaymentConditionUrl,
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
};

export default siteUtilityService;

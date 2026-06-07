// Contracts data-access service — the ONLY place that talks to the contracts API. Wraps the
// canonical apiFetch (config.apiUrl === /v2). Components/hooks call these helpers, never
// fetch/apiFetch directly. All responses share the { success, message, data, translationKey }
// envelope; helpers return the parsed envelope.
//
// Two surfaces:
//  • AUTHED staff/admin surface (apiFetch.* — credentialed, cookie auth). Points at
//    /v2/contracts. Object scope is enforced SERVER-SIDE (lead-scope) — the FE gates buttons
//    on the CONTRACT.* permission CODES (the contract dto emits NO capabilities.*).
//  • PUBLIC client e-sign surface (apiFetch.public.* — token-based, NO session, _skipRefresh
//    so a 401 never triggers a refresh/redirect). Points at /v2/client/contracts.
//
// §5c deltas baked in here:
//  • Workflow-action renames: cancel → POST /:id/actions/cancel; generate token →
//    POST /:id/actions/generate-pdf-token; payment status → POST .../actions/change-status;
//    payment amounts → POST .../actions/update-amounts.
//  • PUBLIC /session/status carries ONLY { token, sessionStatus } — NO client `id` (the
//    session is keyed by the verified arToken server-side; the legacy `id` IDOR is closed).
//  • PUBLIC /generate-pdf body matches the BE .strict(): { sessionData:{ arToken }, signatureUrl, lng }.
//    signatureUrl MUST be a RELATIVE /uploads/... path (the BE SSRF-locks it).
//  • Mutating bodies are built to match the BE .strict() schemas exactly (no extra keys).

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  contractsForLeadUrl,
  CREATE_CONTRACT_URL,
  contractDetailUrl,
  contractBasicsUrl,
  contractCancelUrl,
  contractGeneratePdfTokenUrl,
  CONTRACT_PAYMENTS_ALL_URL,
  contractStagesUrl,
  contractStageUrl,
  contractPaymentsUrl,
  contractPaymentUrl,
  contractPaymentChangeStatusUrl,
  paymentChangeStatusUrl,
  paymentUpdateAmountsUrl,
  contractDrawingsUrl,
  contractDrawingUrl,
  contractSpecialItemsUrl,
  contractSpecialItemUrl,
  CLIENT_SESSION_URL,
  CLIENT_SESSION_STATUS_URL,
  CLIENT_GENERATE_PDF_URL,
  projectGroupsForLeadUrl,
  PAYMENT_CONDITIONS_URL,
} from "./config/constant.js";

// Build a query string with top-level params (skips empty/null/undefined).
function buildQuery(base, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

// Pick ONLY the whitelisted keys (the BE .strict() schemas reject extra keys). Drops
// undefined; KEEPS null/0/"" so explicit clears (e.g. note: "") still pass through.
function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => {
    if (obj != null && obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

// A single payment item as the BE paymentItem .strict() accepts:
// { amount, note?, condition?, conditionId?, type? }.
function pickPaymentItem(p) {
  return pick(p, ["amount", "note", "condition", "conditionId", "type"]);
}

// A single stage item as the BE stageItem .strict() accepts:
// { levelEnum, deliveryDays?, deptDeliveryDays?, isActive? }.
function pickStageItem(s) {
  return pick(s, ["levelEnum", "deliveryDays", "deptDeliveryDays", "isActive"]);
}

function pickDrawingItem(d) {
  return pick(d, ["url", "fileName"]);
}

function pickSpecialItem(it) {
  return pick(it, ["labelAr", "labelEn"]);
}

export const contractsService = {
  // ════════════════════════════════════════════════════════════════════════════
  //  AUTHED — contract lifecycle
  // ════════════════════════════════════════════════════════════════════════════
  // GET /client-lead/:leadId → ARRAY of contracts (each with stages + derived `level`).
  listForLead: (leadId) => apiFetch.get(contractsForLeadUrl(leadId)),

  // GET /:contractId → contract detail object.
  getById: (contractId) => apiFetch.get(contractDetailUrl(contractId)),

  // POST / — createContract. body (.strict): clientLeadId, title?, enTitle?, arName?, enName?,
  // projectGroupId?, payments[] (>=1), stages[] (>=1), drawings?, specialItems?, oldContractId?,
  // markOldAsCancelled?.
  create: (payload) =>
    apiFetch.post(CREATE_CONTRACT_URL, {
      clientLeadId: payload.clientLeadId,
      ...pick(payload, ["title", "enTitle", "arName", "enName", "projectGroupId"]),
      payments: (payload.payments || []).map(pickPaymentItem),
      stages: (payload.stages || []).map(pickStageItem),
      ...(payload.drawings ? { drawings: payload.drawings.map(pickDrawingItem) } : {}),
      ...(payload.specialItems ? { specialItems: payload.specialItems.map(pickSpecialItem) } : {}),
    }),

  // PUT /:contractId/basics — body (.strict): title?, enTitle?, arName?, enName?, projectGroupId?
  updateBasics: (contractId, payload) =>
    apiFetch.put(
      contractBasicsUrl(contractId),
      pick(payload, ["title", "enTitle", "arName", "enName", "projectGroupId"]),
    ),

  // POST /:contractId/actions/cancel — 🔒 builds a cancelled PDF server-side. No body.
  cancel: (contractId) => apiFetch.post(contractCancelUrl(contractId)),

  // POST /:contractId/actions/generate-pdf-token — mints ar/en signing tokens. No body.
  generatePdfToken: (contractId) => apiFetch.post(contractGeneratePdfTokenUrl(contractId)),

  // ════════════════════════════════════════════════════════════════════════════
  //  AUTHED — grouped payments list (role-scoped INSIDE the frozen service)
  // ════════════════════════════════════════════════════════════════════════════
  // GET /payments/all?page=&limit=&status=
  paymentsGrouped: ({ page = 1, limit = 10, status = "DUE" } = {}) =>
    apiFetch.get(buildQuery(CONTRACT_PAYMENTS_ALL_URL, { page, limit, status })),

  // ════════════════════════════════════════════════════════════════════════════
  //  AUTHED — stages
  // ════════════════════════════════════════════════════════════════════════════
  createStage: (contractId, stage) =>
    apiFetch.post(contractStagesUrl(contractId), pickStageItem(stage)),
  // PUT /:contractId/stages/:stageId — body (.strict): deliveryDays?, deptDeliveryDays?
  updateStage: (contractId, stageId, newStage) =>
    apiFetch.put(
      contractStageUrl(contractId, stageId),
      pick(newStage, ["deliveryDays", "deptDeliveryDays"]),
    ),
  deleteStage: (contractId, stageId) => apiFetch.delete(contractStageUrl(contractId, stageId)),

  // ════════════════════════════════════════════════════════════════════════════
  //  AUTHED — payments (CRUD + workflow actions)
  // ════════════════════════════════════════════════════════════════════════════
  createPayment: (contractId, payment) =>
    apiFetch.post(contractPaymentsUrl(contractId), pickPaymentItem(payment)),
  // PUT /:contractId/payments/:paymentId — body (.strict): amount?, condition?, conditionId?, type?, note?
  updatePayment: (contractId, paymentId, newPayment) =>
    apiFetch.put(
      contractPaymentUrl(contractId, paymentId),
      pick(newPayment, ["amount", "condition", "conditionId", "type", "note"]),
    ),
  deletePayment: (contractId, paymentId) =>
    apiFetch.delete(contractPaymentUrl(contractId, paymentId)),

  // POST /:contractId/payments/:paymentId/actions/change-status — body (.strict): { status }
  changePaymentStatus: (contractId, paymentId, status) =>
    apiFetch.post(contractPaymentChangeStatusUrl(contractId, paymentId), { status }),

  // Bare-payment actions (used by the grouped payments view — no contractId):
  // POST /payments/:paymentId/actions/change-status — body (.strict): { status }
  changePaymentStatusBare: (paymentId, status) =>
    apiFetch.post(paymentChangeStatusUrl(paymentId), { status }),
  // POST /payments/:paymentId/actions/update-amounts — body (.strict): { amountLost?, amountReceived?, status? }
  updatePaymentAmounts: (paymentId, body) =>
    apiFetch.post(
      paymentUpdateAmountsUrl(paymentId),
      pick(body, ["amountLost", "amountReceived", "status"]),
    ),

  // ════════════════════════════════════════════════════════════════════════════
  //  AUTHED — drawings
  // ════════════════════════════════════════════════════════════════════════════
  createDrawing: (contractId, drawing) =>
    apiFetch.post(contractDrawingsUrl(contractId), pickDrawingItem(drawing)),
  // PUT /:contractId/drawings/:drawId — body (.strict): url?, fileName?
  updateDrawing: (contractId, drawId, newDrawing) =>
    apiFetch.put(contractDrawingUrl(contractId, drawId), pick(newDrawing, ["url", "fileName"])),
  deleteDrawing: (contractId, drawId) => apiFetch.delete(contractDrawingUrl(contractId, drawId)),

  // ════════════════════════════════════════════════════════════════════════════
  //  AUTHED — special items
  // ════════════════════════════════════════════════════════════════════════════
  createSpecialItem: (contractId, item) =>
    apiFetch.post(contractSpecialItemsUrl(contractId), pickSpecialItem(item)),
  updateSpecialItem: (contractId, itemId, newItem) =>
    apiFetch.put(contractSpecialItemUrl(contractId, itemId), pickSpecialItem(newItem)),
  deleteSpecialItem: (contractId, itemId) =>
    apiFetch.delete(contractSpecialItemUrl(contractId, itemId)),

  // ════════════════════════════════════════════════════════════════════════════
  //  AUTHED — cross-module reads the create flow needs (gated on their own codes)
  // ════════════════════════════════════════════════════════════════════════════
  // GET /v2/projects/:leadId/groups → unique project groups for a lead [project.list]
  getProjectGroups: (leadId) => apiFetch.get(projectGroupsForLeadUrl(leadId)),
  // GET /v2/site-utilities/contract-payment-conditions [site_utility.payment_condition.list]
  getPaymentConditions: () => apiFetch.get(PAYMENT_CONDITIONS_URL),

  // ════════════════════════════════════════════════════════════════════════════
  //  PUBLIC client e-sign surface (token-based; apiFetch.public, NO session)
  // ════════════════════════════════════════════════════════════════════════════
  // GET /session?token= → { data: session, contractUtility }
  getSession: (token) => apiFetch.public.get(buildQuery(CLIENT_SESSION_URL, { token })),

  // PUT /session/status — body (.strict): { token, sessionStatus }. NO client `id`.
  changeSessionStatus: ({ token, sessionStatus }) =>
    apiFetch.public.put(CLIENT_SESSION_STATUS_URL, { token, sessionStatus }),

  // POST /generate-pdf — body (.strict): { sessionData:{ arToken }, signatureUrl, lng }.
  // The session is selected EXCLUSIVELY by sessionData.arToken; signatureUrl is a relative
  // /uploads/... path produced by the v2 chunk upload.
  generatePdf: ({ arToken, signatureUrl, lng = "ar" }) =>
    apiFetch.public.post(CLIENT_GENERATE_PDF_URL, {
      sessionData: { arToken },
      signatureUrl,
      lng,
    }),
};

export default contractsService;

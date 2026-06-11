// Contracts domain — API contract surface. All paths are relative to the v2 API base
// (apiFetch is configured with config.apiUrl === /v2). One place to edit if a backend path
// changes (reconciliation point vs server/src/modules/contracts/*/*.{route,validation}.js).
//
// Backend contract (confirmed against the v2 route files):
//   AUTHED staff/admin surface (legacy `/shared/contracts/*`, SHARED gate = all 9 authed
//   roles → granted via CONTRACT_AUTHED). Contracts are LEAD-SCOPED: the BE resolves the
//   parent clientLead and runs the leads-module object-scope checker (access for reads,
//   mutate for writes) before any read/write. NO per-record capabilities.* — gate on CODES.
//   /v2/contracts:
//     GET    /client-lead/:leadId                          → lead-scoped contract list (ARRAY)        [contract.list]
//     POST   /                                             → create a contract                         [contract.create]
//     GET    /payments/all?page=&limit=&status=            → grouped payments (role-scoped, object)    [contract.payment.list]
//     GET    /:contractId                                  → contract detail (object)                  [contract.view]
//     POST   /:contractId/actions/cancel                   → 🔒 cancel (builds cancelled PDF)          [contract.cancel]
//     PUT    /:contractId/basics                           → edit basics                               [contract.edit]
//     POST   /:contractId/actions/generate-pdf-token       → mint ar/en signing tokens                 [contract.generate_pdf_token]
//     POST   /:contractId/stages                           → create stage                              [contract.stage.manage]
//     PUT    /:contractId/stages/:stageId                  → update stage                              [contract.stage.manage]
//     DELETE /:contractId/stages/:stageId                  → delete stage                              [contract.stage.manage]
//     POST   /:contractId/payments                         → create payment                            [contract.payment.manage]
//     PUT    /:contractId/payments/:paymentId              → update payment                            [contract.payment.manage]
//     DELETE /:contractId/payments/:paymentId              → delete payment                            [contract.payment.manage]
//     POST   /:contractId/payments/:paymentId/actions/change-status → change payment status            [contract.payment.manage]
//     POST   /payments/:paymentId/actions/change-status    → change payment status (bare)              [contract.payment.manage]
//     POST   /payments/:paymentId/actions/update-amounts   → update payment amounts (money-validated)  [contract.payment.manage]
//     POST   /:contractId/drawings                         → create drawing                            [contract.drawing.manage]
//     PUT    /:contractId/drawings/:drawId                 → update drawing                            [contract.drawing.manage]
//     DELETE /:contractId/drawings/:drawId                 → delete drawing                            [contract.drawing.manage]
//     POST   /:contractId/special-items                    → create special item                       [contract.special_item.manage]
//     PUT    /:contractId/special-items/:itemId            → update special item                       [contract.special_item.manage]
//     DELETE /:contractId/special-items/:itemId            → delete special item                       [contract.special_item.manage]
//
//   §5c WORKFLOW-ACTION RENAMES (FE repointed here):
//     PATCH /:contractId/cancel       → POST /:contractId/actions/cancel
//     PATCH /:contractId  (gen token) → POST /:contractId/actions/generate-pdf-token
//     POST  /payments/:id/status      → POST /payments/:id/actions/change-status
//     POST  /payments/:id/amounts     → POST /payments/:id/actions/update-amounts
//
//   PUBLIC client e-sign surface (UNGATED — the per-session arToken IS the auth). Mounted at
//   /v2/client/contracts. The session is derived FROM the token server-side — NEVER from a
//   client-supplied id. Envelope CODES replaced the legacy Arabic prose.
//   /v2/client/contracts:
//     GET  /session?token=               → session + default contract-utility data (object)
//     PUT  /session/status               → token-keyed status change. body { token, sessionStatus } — NO client id
//     POST /generate-pdf                 → 🔒 finalize (token authoritative). body
//                                          { sessionData:{ arToken }, signatureUrl, lng } — signatureUrl a RELATIVE /uploads/... path
//
//   CROSS-MODULE reads the authed create flow depends on (gated on their own codes):
//     GET /v2/projects/:leadId/groups                     → unique project groups for a lead [project.list]
//     GET /v2/site-utilities/contract-payment-conditions  → payment conditions               [site_utility.payment_condition.list]

// ── authed staff/admin surface ─────────────────────────────────────────────────────────
export const CONTRACTS_BASE = "contracts";

export const contractsForLeadUrl = (leadId) => `${CONTRACTS_BASE}/client-lead/${leadId}`;
export const CREATE_CONTRACT_URL = CONTRACTS_BASE;
export const contractDetailUrl = (contractId) => `${CONTRACTS_BASE}/${contractId}`;
export const contractBasicsUrl = (contractId) => `${CONTRACTS_BASE}/${contractId}/basics`;

// workflow actions (POST) — §5c renames
export const contractCancelUrl = (contractId) => `${CONTRACTS_BASE}/${contractId}/actions/cancel`;
export const contractGeneratePdfTokenUrl = (contractId) =>
  `${CONTRACTS_BASE}/${contractId}/actions/generate-pdf-token`;

// grouped payments (role-scoped)
export const CONTRACT_PAYMENTS_ALL_URL = `${CONTRACTS_BASE}/payments/all`;

// stages
export const contractStagesUrl = (contractId) => `${CONTRACTS_BASE}/${contractId}/stages`;
export const contractStageUrl = (contractId, stageId) =>
  `${CONTRACTS_BASE}/${contractId}/stages/${stageId}`;

// payments (contract-scoped CRUD + actions)
export const contractPaymentsUrl = (contractId) => `${CONTRACTS_BASE}/${contractId}/payments`;
export const contractPaymentUrl = (contractId, paymentId) =>
  `${CONTRACTS_BASE}/${contractId}/payments/${paymentId}`;
export const contractPaymentChangeStatusUrl = (contractId, paymentId) =>
  `${CONTRACTS_BASE}/${contractId}/payments/${paymentId}/actions/change-status`;
// bare-payment actions (no contractId)
export const paymentChangeStatusUrl = (paymentId) =>
  `${CONTRACTS_BASE}/payments/${paymentId}/actions/change-status`;
export const paymentUpdateAmountsUrl = (paymentId) =>
  `${CONTRACTS_BASE}/payments/${paymentId}/actions/update-amounts`;

// drawings
export const contractDrawingsUrl = (contractId) => `${CONTRACTS_BASE}/${contractId}/drawings`;
export const contractDrawingUrl = (contractId, drawId) =>
  `${CONTRACTS_BASE}/${contractId}/drawings/${drawId}`;

// special items
export const contractSpecialItemsUrl = (contractId) =>
  `${CONTRACTS_BASE}/${contractId}/special-items`;
export const contractSpecialItemUrl = (contractId, itemId) =>
  `${CONTRACTS_BASE}/${contractId}/special-items/${itemId}`;

// ── PUBLIC client e-sign surface (ungated, token-based) ────────────────────────────────
export const CLIENT_CONTRACTS_BASE = "client/contracts";
export const CLIENT_SESSION_URL = `${CLIENT_CONTRACTS_BASE}/session`;
export const CLIENT_SESSION_STATUS_URL = `${CLIENT_CONTRACTS_BASE}/session/status`;
export const CLIENT_GENERATE_PDF_URL = `${CLIENT_CONTRACTS_BASE}/generate-pdf`;

// ── cross-module reads the authed create flow needs ────────────────────────────────────
export const projectGroupsForLeadUrl = (leadId) => `projects/${leadId}/groups`;
export const PAYMENT_CONDITIONS_URL = "site-utilities/contract-payment-conditions";

// contracts module message CODES. SCREAMING_SNAKE_CASE, key === value (the string IS
// the code). Carried in the API envelope `message` field; the client resolves
// (translationKey: contractsMessages, code) → displayed string. Language-neutral —
// never put Arabic/English prose here.
//
// Covers BOTH contract surfaces:
//   1. The authed staff/admin CRUD surface (legacy `/shared/contracts/*`, SHARED gate =
//      all 9 authed roles). Contracts are LEAD-SCOPED; the v2 module resolves the parent
//      clientLead and runs the leads-module object-scope checker (reads access-scope,
//      writes mutate-scope) before any read/write — the IDOR fix the legacy routes were
//      MISSING (no object scope at all).
//   2. The PUBLIC client e-sign surface (legacy `/client/contracts/*`, token-based, NO
//      auth). The legacy handlers returned ARABIC + English PROSE ("تم حفظ الاستجابة
//      بنجاح" / "Response saved successfully" / "Error in generating pdf") — every one is
//      REPLACED here with a language-neutral code. The token IS the authentication; the
//      session is derived FROM the token, never from a client-supplied id.
//
// 🔒 PDF generation is LOGIC-FROZEN: the v2 module only WRAPS the existing
// `buildAndUploadContractPdf` service via a lazy adapter (CONTRACT_PDF_GENERATED is the
// success code for the public generate-pdf flow). The PDF logic / fonts / output are
// never touched.
export const contractsMessagesCodes = {
  // ── authed reads ────────────────────────────────────────────────────────────────
  CONTRACTS_FETCHED: "CONTRACTS_FETCHED", // GET /client-lead/:leadId (lead-scoped list)
  CONTRACT_FETCHED: "CONTRACT_FETCHED", // GET /:contractId (lead-scoped detail)
  CONTRACT_PAYMENTS_FETCHED: "CONTRACT_PAYMENTS_FETCHED", // GET /payments/all (role-scoped)

  // ── authed writes (contract) ──────────────────────────────────────────────────────
  CONTRACT_CREATED: "CONTRACT_CREATED", // POST /
  CONTRACT_UPDATED: "CONTRACT_UPDATED", // PUT /:contractId/basics
  CONTRACT_CANCELLED: "CONTRACT_CANCELLED", // POST /:contractId/actions/cancel
  CONTRACT_PDF_TOKEN_GENERATED: "CONTRACT_PDF_TOKEN_GENERATED", // POST /:contractId/actions/generate-pdf-token

  // ── authed writes (stages) ─────────────────────────────────────────────────────────
  CONTRACT_STAGE_CREATED: "CONTRACT_STAGE_CREATED",
  CONTRACT_STAGE_UPDATED: "CONTRACT_STAGE_UPDATED",
  CONTRACT_STAGE_DELETED: "CONTRACT_STAGE_DELETED",

  // ── authed writes (payments) ───────────────────────────────────────────────────────
  CONTRACT_PAYMENT_CREATED: "CONTRACT_PAYMENT_CREATED",
  CONTRACT_PAYMENT_UPDATED: "CONTRACT_PAYMENT_UPDATED",
  CONTRACT_PAYMENT_DELETED: "CONTRACT_PAYMENT_DELETED",
  CONTRACT_PAYMENT_STATUS_UPDATED: "CONTRACT_PAYMENT_STATUS_UPDATED",
  CONTRACT_PAYMENT_AMOUNTS_UPDATED: "CONTRACT_PAYMENT_AMOUNTS_UPDATED",

  // ── authed writes (drawings) ───────────────────────────────────────────────────────
  CONTRACT_DRAWING_CREATED: "CONTRACT_DRAWING_CREATED",
  CONTRACT_DRAWING_UPDATED: "CONTRACT_DRAWING_UPDATED",
  CONTRACT_DRAWING_DELETED: "CONTRACT_DRAWING_DELETED",

  // ── authed writes (special items) ──────────────────────────────────────────────────
  CONTRACT_SPECIAL_ITEM_CREATED: "CONTRACT_SPECIAL_ITEM_CREATED",
  CONTRACT_SPECIAL_ITEM_UPDATED: "CONTRACT_SPECIAL_ITEM_UPDATED",
  CONTRACT_SPECIAL_ITEM_DELETED: "CONTRACT_SPECIAL_ITEM_DELETED",

  // ── public client e-sign surface ───────────────────────────────────────────────────
  CONTRACT_SESSION_FETCHED: "CONTRACT_SESSION_FETCHED", // GET /session?token=
  CONTRACT_SESSION_STATUS_UPDATED: "CONTRACT_SESSION_STATUS_UPDATED", // PUT /session/status
  CONTRACT_PDF_GENERATED: "CONTRACT_PDF_GENERATED", // POST /generate-pdf (🔒 wraps frozen builder)

  // ── errors / domain rules ──────────────────────────────────────────────────────────
  CONTRACT_NOT_FOUND: "CONTRACT_NOT_FOUND", // contract id resolves to nothing
  CONTRACT_SESSION_INVALID: "CONTRACT_SESSION_INVALID", // missing/invalid signing token
  CONTRACT_PDF_GENERATION_FAILED: "CONTRACT_PDF_GENERATION_FAILED", // PDF builder threw (public flow)
};

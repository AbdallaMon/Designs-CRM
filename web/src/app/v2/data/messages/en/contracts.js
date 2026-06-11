// English mirror of the CONTRACTS message CODES (namespace "contractsMessages").
// CODE → English. Mirrors keys 1:1 with ../contracts.js (the Arabic map). Bilingual Phase 1.

export const contractsMessagesEn = {
  // ── authed reads ────────────────────────────────────────────────────────────────
  CONTRACTS_FETCHED: "Contracts retrieved",
  CONTRACT_FETCHED: "Contract retrieved",
  CONTRACT_PAYMENTS_FETCHED: "Payments retrieved",

  // ── authed writes (contract lifecycle) ─────────────────────────────────────────────
  CONTRACT_CREATED: "Contract created",
  CONTRACT_UPDATED: "Contract updated",
  CONTRACT_CANCELLED: "Contract cancelled",
  CONTRACT_PDF_TOKEN_GENERATED: "Signing link generated",

  // ── authed writes (stages) ─────────────────────────────────────────────────────────
  CONTRACT_STAGE_CREATED: "Stage added",
  CONTRACT_STAGE_UPDATED: "Stage updated",
  CONTRACT_STAGE_DELETED: "Stage deleted",

  // ── authed writes (payments) ───────────────────────────────────────────────────────
  CONTRACT_PAYMENT_CREATED: "Payment added",
  CONTRACT_PAYMENT_UPDATED: "Payment updated",
  CONTRACT_PAYMENT_DELETED: "Payment deleted",
  CONTRACT_PAYMENT_STATUS_UPDATED: "Payment status updated",
  CONTRACT_PAYMENT_AMOUNTS_UPDATED: "Payment amounts updated",

  // ── authed writes (drawings) ───────────────────────────────────────────────────────
  CONTRACT_DRAWING_CREATED: "Drawing added",
  CONTRACT_DRAWING_UPDATED: "Drawing updated",
  CONTRACT_DRAWING_DELETED: "Drawing deleted",

  // ── authed writes (special items) ──────────────────────────────────────────────────
  CONTRACT_SPECIAL_ITEM_CREATED: "Special item added",
  CONTRACT_SPECIAL_ITEM_UPDATED: "Special item updated",
  CONTRACT_SPECIAL_ITEM_DELETED: "Special item deleted",

  // ── public client e-sign surface ───────────────────────────────────────────────────
  CONTRACT_SESSION_FETCHED: "Contract data retrieved",
  CONTRACT_SESSION_STATUS_UPDATED: "Response saved successfully",
  CONTRACT_PDF_GENERATED: "Contract signed successfully",

  // ── errors / domain rules ──────────────────────────────────────────────────────────
  CONTRACT_NOT_FOUND: "Contract not found",
  CONTRACT_SESSION_INVALID: "Invalid signing link",
  CONTRACT_PDF_GENERATION_FAILED: "Failed to generate the contract file",
};

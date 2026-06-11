// English mirror of the SITE-UTILITY message CODES (namespace "siteUtilityMessages").
// CODE → English. Mirrors keys 1:1 with ../siteUtility.js (the Arabic map). Bilingual Phase 1.

export const siteUtilityMessagesEn = {
  // ── reads ────────────────────────────────────────────────────────────────────
  PDF_CONFIG_FETCHED: "PDF settings retrieved",
  PAYMENT_CONDITIONS_FETCHED: "Payment conditions retrieved",

  // ── mutations ──────────────────────────────────────────────────────────────────
  PDF_CONFIG_UPDATED: "PDF settings updated",
  PAYMENT_CONDITION_CREATED: "Payment condition created",
  PAYMENT_CONDITION_UPDATED: "Payment condition updated",
  PAYMENT_CONDITION_DELETED: "Payment condition deleted",

  // ── errors ───────────────────────────────────────────────────────────────────
  PAYMENT_CONDITION_NOT_FOUND: "Payment condition not found",
  PAYMENT_CONDITION_RESERVED_VALUE: "This reserved condition can't be created",
  PAYMENT_CONDITION_IN_USE: "A payment condition linked to contract payments can't be deleted",

  // ── contract utility (obligations + stage/special/level clause templates) ─────
  CONTRACT_UTILITY_FETCHED: "Design contract settings retrieved",
  OBLIGATIONS_FETCHED: "Both parties' obligations retrieved",
  OBLIGATIONS_SAVED: "Both parties' obligations saved",
  STAGE_CLAUSES_FETCHED: "Stage clauses retrieved",
  STAGE_CLAUSE_CREATED: "Stage clause created",
  STAGE_CLAUSE_UPDATED: "Stage clause updated",
  STAGE_CLAUSE_DELETED: "Stage clause deleted",
  SPECIAL_CLAUSES_FETCHED: "Special clauses retrieved",
  SPECIAL_CLAUSE_CREATED: "Special clause created",
  SPECIAL_CLAUSE_UPDATED: "Special clause updated",
  SPECIAL_CLAUSE_DELETED: "Special clause deleted",
  LEVEL_CLAUSES_FETCHED: "Level clauses retrieved",
  LEVEL_CLAUSE_CREATED: "Level clause created",
  LEVEL_CLAUSE_UPDATED: "Level clause updated",
  LEVEL_CLAUSE_DELETED: "Level clause deleted",
  CONTRACT_UTILITY_NOT_FOUND:
    "Design contract settings are not initialized yet — save the obligations first",
  CLAUSE_NOT_FOUND: "Clause not found",
  INVALID_LEVEL: "Invalid level",
};

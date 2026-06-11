// Site-utility module message CODES. SCREAMING_SNAKE_CASE, key === value (the
// string IS the code). Carried in the API envelope `message` field; the client
// resolves (translationKey: siteUtilityMessages, code) to a displayed string.
// Language-neutral — never put Arabic/English prose here.
export const siteUtilityMessagesCodes = {
  // ── reads ────────────────────────────────────────────────────────────────
  PDF_CONFIG_FETCHED: "PDF_CONFIG_FETCHED",
  PAYMENT_CONDITIONS_FETCHED: "PAYMENT_CONDITIONS_FETCHED",

  // ── mutations ──────────────────────────────────────────────────────────────
  PDF_CONFIG_UPDATED: "PDF_CONFIG_UPDATED",
  PAYMENT_CONDITION_CREATED: "PAYMENT_CONDITION_CREATED",
  PAYMENT_CONDITION_UPDATED: "PAYMENT_CONDITION_UPDATED",
  PAYMENT_CONDITION_DELETED: "PAYMENT_CONDITION_DELETED",

  // ── errors ───────────────────────────────────────────────────────────────
  PAYMENT_CONDITION_NOT_FOUND: "PAYMENT_CONDITION_NOT_FOUND",
  // Legacy invariant: the reserved "To Do" condition cannot be created.
  PAYMENT_CONDITION_RESERVED_VALUE: "PAYMENT_CONDITION_RESERVED_VALUE",
  // Legacy invariant: cannot delete a condition still linked to contract payments.
  PAYMENT_CONDITION_IN_USE: "PAYMENT_CONDITION_IN_USE",

  // ── contract utility (obligations + stage/special/level clause templates) ──
  CONTRACT_UTILITY_FETCHED: "CONTRACT_UTILITY_FETCHED",
  OBLIGATIONS_FETCHED: "OBLIGATIONS_FETCHED",
  OBLIGATIONS_SAVED: "OBLIGATIONS_SAVED",
  STAGE_CLAUSES_FETCHED: "STAGE_CLAUSES_FETCHED",
  STAGE_CLAUSE_CREATED: "STAGE_CLAUSE_CREATED",
  STAGE_CLAUSE_UPDATED: "STAGE_CLAUSE_UPDATED",
  STAGE_CLAUSE_DELETED: "STAGE_CLAUSE_DELETED",
  SPECIAL_CLAUSES_FETCHED: "SPECIAL_CLAUSES_FETCHED",
  SPECIAL_CLAUSE_CREATED: "SPECIAL_CLAUSE_CREATED",
  SPECIAL_CLAUSE_UPDATED: "SPECIAL_CLAUSE_UPDATED",
  SPECIAL_CLAUSE_DELETED: "SPECIAL_CLAUSE_DELETED",
  LEVEL_CLAUSES_FETCHED: "LEVEL_CLAUSES_FETCHED",
  LEVEL_CLAUSE_CREATED: "LEVEL_CLAUSE_CREATED",
  LEVEL_CLAUSE_UPDATED: "LEVEL_CLAUSE_UPDATED",
  LEVEL_CLAUSE_DELETED: "LEVEL_CLAUSE_DELETED",
  // The contract-utility singleton row does not yet exist (no boilerplate seeded).
  CONTRACT_UTILITY_NOT_FOUND: "CONTRACT_UTILITY_NOT_FOUND",
  // A clause id was not found.
  CLAUSE_NOT_FOUND: "CLAUSE_NOT_FOUND",
  // level outside ContractLevel enum (LEVEL_1..LEVEL_7).
  INVALID_LEVEL: "INVALID_LEVEL",
};

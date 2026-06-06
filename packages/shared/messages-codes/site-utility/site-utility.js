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
};

// utilities module message CODES. SCREAMING_SNAKE_CASE, key === value (the string IS
// the code). Carried in the API envelope `message` field; the client resolves
// (translationKey: utilitiesMessages, code) → displayed string. Language-neutral —
// never put Arabic/English prose here.
//
// Covers the lookup/pick-list reads (fixed-data, user logs, admins/roles directory,
// image lookups, generic allow-listed model reads) and the cross-model search. The
// heavy legacy services are invoked via lazy adapters and may still throw plain Errors,
// surfaced by the generic error handler; the codes here cover the v2-owned outcomes.
export const utilitiesMessagesCodes = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  FIXED_DATA_FETCHED: "FIXED_DATA_FETCHED",
  USER_LOG_FETCHED: "USER_LOG_FETCHED",
  USER_ROLE_FETCHED: "USER_ROLE_FETCHED",
  ROLES_FETCHED: "ROLES_FETCHED",
  ADMINS_FETCHED: "ADMINS_FETCHED",
  IMAGES_FETCHED: "IMAGES_FETCHED",
  MODEL_FETCHED: "MODEL_FETCHED",
  MODEL_IDS_FETCHED: "MODEL_IDS_FETCHED",
  SEARCH_RESULTS_FETCHED: "SEARCH_RESULTS_FETCHED",

  // ── writes ─────────────────────────────────────────────────────────────────────
  USER_LOG_SUBMITTED: "USER_LOG_SUBMITTED",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  MODEL_NOT_ALLOWED: "MODEL_NOT_ALLOWED", // requested model is not in the allow-list (hardening)
};

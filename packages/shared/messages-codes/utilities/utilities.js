// utilities module message CODES. SCREAMING_SNAKE_CASE, key === value (the string IS
// the code). Carried in the API envelope `message` field; the client resolves
// (translationKey: utilitiesMessages, code) → displayed string. Language-neutral —
// never put Arabic/English prose here.
//
// Covers lookup/pick-list reads (fixed-data, user logs, profile/admin directory,
// image lookups, allow-listed model reads) and cross-model search.
export const utilitiesMessagesCodes = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  FIXED_DATA_FETCHED: "FIXED_DATA_FETCHED",
  USER_LOG_FETCHED: "USER_LOG_FETCHED",
  USER_PROFILE_FETCHED: "USER_PROFILE_FETCHED",
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

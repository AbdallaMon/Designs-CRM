// users/user module message CODES. SCREAMING_SNAKE_CASE, key === value (the string
// IS the code). Carried in the API envelope `message` field; the client resolves
// (translationKey: usersMessages, code) → displayed string. Language-neutral — never
// put Arabic/English prose here.
export const userMessagesCodes = {
  // ── reads / generic ──────────────────────────────────────────────────────────
  USERS_FETCHED: "USERS_FETCHED", // GET /users (paginated management list)
  ALL_USERS_FETCHED: "ALL_USERS_FETCHED", // GET /all-users (role-grouped pick list)
  USERS_DIRECTORY_FETCHED: "USERS_DIRECTORY_FETCHED", // GET /directory , /related-chat-directory
  USER_PROFILE_FETCHED: "USER_PROFILE_FETCHED",
  USER_LOGS_FETCHED: "USER_LOGS_FETCHED", // GET /:userId/logs (today notifications)
  USER_LAST_SEEN_FETCHED: "USER_LAST_SEEN_FETCHED", // GET /:userId/last-seen (monthly activity)
  RESTRICTED_COUNTRIES_FETCHED: "RESTRICTED_COUNTRIES_FETCHED",
  AUTO_ASSIGNMENTS_FETCHED: "AUTO_ASSIGNMENTS_FETCHED",

  // ── success / mutations ──────────────────────────────────────────────────────
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_STATUS_TOGGLED: "USER_STATUS_TOGGLED", // ban / unban (changeUserStatus)
  USER_STAFF_EXTRA_UPDATED: "USER_STAFF_EXTRA_UPDATED",
  USER_ROLES_UPDATED: "USER_ROLES_UPDATED",
  USER_PROFILE_UPDATED: "USER_PROFILE_UPDATED",
  RESTRICTED_COUNTRIES_UPDATED: "RESTRICTED_COUNTRIES_UPDATED",
  AUTO_ASSIGNMENTS_UPDATED: "AUTO_ASSIGNMENTS_UPDATED",
  USER_MAX_LEADS_UPDATED: "USER_MAX_LEADS_UPDATED",
  USER_MAX_LEADS_PER_DAY_UPDATED: "USER_MAX_LEADS_PER_DAY_UPDATED",

  // ── errors / scope / guards ──────────────────────────────────────────────────
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_PROFILE_NOT_FOUND: "USER_PROFILE_NOT_FOUND",
  USER_PROFILE_ACCESS_DENIED: "USER_PROFILE_ACCESS_DENIED", // not self and not admin-tier (IDOR fix)
  USER_PROFILE_MUTATE_DENIED: "USER_PROFILE_MUTATE_DENIED", // not self and not admin-tier (IDOR fix)
  EMAIL_ALREADY_REGISTERED: "EMAIL_ALREADY_REGISTERED", // legacy P2002 on email
  USER_NO_DATA_SENT: "USER_NO_DATA_SENT", // legacy "No data was sent" on create
  USER_ROLE_NOT_ALLOWED: "USER_ROLE_NOT_ALLOWED", // super-sales creating/editing non-STAFF roles
};

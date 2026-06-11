// English mirror of the USERS message CODES (namespace "usersMessages").
// CODE → English. Mirrors keys 1:1 with ../users.js (the Arabic map). Bilingual Phase 1.

export const usersMessagesEn = {
  // ── reads / generic ──────────────────────────────────────────────────────────
  USERS_FETCHED: "Users retrieved",
  ALL_USERS_FETCHED: "User list retrieved",
  USERS_DIRECTORY_FETCHED: "User directory retrieved",
  USER_PROFILE_FETCHED: "Profile retrieved",
  USER_LOGS_FETCHED: "Logs retrieved",
  USER_LAST_SEEN_FETCHED: "Last activity retrieved",
  RESTRICTED_COUNTRIES_FETCHED: "Restricted countries retrieved",
  AUTO_ASSIGNMENTS_FETCHED: "Auto-assignments retrieved",

  // ── success / mutations ──────────────────────────────────────────────────────
  USER_CREATED: "User created",
  USER_UPDATED: "User updated",
  USER_STATUS_TOGGLED: "User status changed",
  USER_STAFF_EXTRA_UPDATED: "Staff details updated",
  USER_ROLES_UPDATED: "Roles updated",
  USER_PROFILE_UPDATED: "Profile updated",
  RESTRICTED_COUNTRIES_UPDATED: "Restricted countries updated",
  AUTO_ASSIGNMENTS_UPDATED: "Auto-assignments updated",
  USER_MAX_LEADS_UPDATED: "Maximum leads updated",
  USER_MAX_LEADS_PER_DAY_UPDATED: "Daily maximum leads updated",

  // ── errors / scope / guards ──────────────────────────────────────────────────
  USER_NOT_FOUND: "User not found",
  USER_PROFILE_NOT_FOUND: "Profile not found",
  USER_PROFILE_ACCESS_DENIED: "You don't have permission to access this profile",
  USER_PROFILE_MUTATE_DENIED: "You don't have permission to edit this profile",
  EMAIL_ALREADY_REGISTERED: "This email is already registered",
  USER_NO_DATA_SENT: "No data was sent",
  USER_ROLE_NOT_ALLOWED: "This role is not allowed",
};

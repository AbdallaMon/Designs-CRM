// Auth / authorization message CODES. SCREAMING_SNAKE_CASE, key === value.
// Used by the auth middleware, JWT verification, and scope checkers. The client
// resolves (translationKey: authMessages, code) to a displayed string via the
// single-language (Arabic) lookup map.
export const authMessagesCodes = {
  // authentication
  UNAUTHORIZED: "UNAUTHORIZED", // no / missing credentials
  INVALID_TOKEN: "INVALID_TOKEN", // present but bad / expired token
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS", // wrong email / password
  ACCOUNT_BLOCKED: "ACCOUNT_BLOCKED", // isActive === false
  REFRESH_TOKEN_MISSING: "REFRESH_TOKEN_MISSING",
  RESET_TOKEN_MISSING: "RESET_TOKEN_MISSING",
  PASSWORD_MUST_DIFFER: "PASSWORD_MUST_DIFFER",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // authorization
  FORBIDDEN: "FORBIDDEN", // lacks the required permission code (gate 1)
  PERMISSION_DENIED: "PERMISSION_DENIED", // specific gate-1 denial with requiredPermissions detail
  ACCESS_DENIED: "ACCESS_DENIED", // record outside the user's scope (gate 2 / IDOR)

  // profiles (DB-relational permissions)
  PROFILE_NOT_ASSIGNED: "PROFILE_NOT_ASSIGNED", // tried to switch to a profile the user doesn't hold
  PROFILE_NOT_FOUND: "PROFILE_NOT_FOUND", // profile id does not exist
  PROFILE_REQUIRED: "PROFILE_REQUIRED", // request has no valid active relational profile
  PROFILE_SWITCHED: "PROFILE_SWITCHED", // success: active profile changed
  PROFILES_UPDATED: "PROFILES_UPDATED", // success: a user's assigned profiles changed (admin)

  // success
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGOUT_SUCCESS: "LOGOUT_SUCCESS",
  TOKENS_REFRESHED: "TOKENS_REFRESHED",
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  CURRENT_USER_RETRIEVED: "CURRENT_USER_RETRIEVED",
};

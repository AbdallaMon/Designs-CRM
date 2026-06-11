// English mirror of the AUTH message CODES (namespace "authMessages").
// CODE → English. Mirrors keys 1:1 with ../auth.js (the Arabic map). Bilingual Phase 1.

export const authMessagesEn = {
  // authentication
  UNAUTHORIZED: "Your session has ended, please sign in again",
  INVALID_TOKEN: "Your session has expired, please sign in again",
  INVALID_CREDENTIALS: "Incorrect email or password",
  ACCOUNT_BLOCKED: "This account has been suspended, contact the administrator",
  REFRESH_TOKEN_MISSING: "Your session has ended, please sign in again",
  RESET_TOKEN_MISSING: "The reset link is invalid or expired",
  PASSWORD_MUST_DIFFER: "The new password must differ from the old one",
  RATE_LIMIT_EXCEEDED: "Too many attempts, please try again later",

  // authorization
  FORBIDDEN: "You don't have permission to perform this action",
  ACCESS_DENIED: "You don't have permission to access this item",

  // success
  LOGIN_SUCCESS: "Signed in successfully",
  LOGOUT_SUCCESS: "Signed out successfully",
  TOKENS_REFRESHED: "Session renewed",
  PASSWORD_RESET_REQUESTED: "A password reset link has been sent",
  PASSWORD_CHANGED: "Password changed successfully",
  CURRENT_USER_RETRIEVED: "User data retrieved",
};

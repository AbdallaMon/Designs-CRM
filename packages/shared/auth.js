// Cookie / token name constants. Single source of truth for the unified JWT
// cookie (Phase 2 unifies the two legacy JWT systems onto these names).
export const AUTH_COOKIE_NAME = "access_token";

export const AUTH_REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

// Legacy cookie name from the retired `SECRET_KEY` 4h scheme. We only ISSUE the
// unified `access_token`/`refresh_token` pair above, but `requireAuth` keeps a
// transitional READ-SHIM that still ACCEPTS this cookie so existing sessions are
// not logged out. Drop this (and the shim) once the transition window closes.
export const LEGACY_AUTH_COOKIE_NAME = "token";

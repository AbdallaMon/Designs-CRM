export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "access_token";

/** Routes that require a logged-in session. `/v2` covers the new authed shell; public v2
 * surfaces (booking / contracts-sign / client-image-session) use apiFetch.public with
 * _skipRefresh, so they never trigger onAuthFailure and are unaffected by this prefix. */
export const PROTECTED_PREFIXES = ["/dashboard", "/v2"];

/** Routes that should redirect away when already logged in. */
export const AUTH_ROUTES = ["/login", "reset"];

export const ZINDEXS = {
  TOAST: 50,
  TOASTLOADINGOVERLAY: 40,
  DIALOG: 100,
  LOADINGOVERLAY: 150,
  OVERLAY: 200,
};

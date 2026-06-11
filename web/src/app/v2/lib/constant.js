export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "access_token";

/** Routes that require a logged-in session. `/v2` covers the new authed shell. NOTE: this is
 * consumed BOTH client-side (AuthProvider.onAuthFailure) AND server-side at the edge by
 * `ui/src/proxy.js`, which 307s unauthenticated hits to /login. Because the proxy gate is
 * unconditional, the PUBLIC token-based v2 surfaces below MUST be exempted or clients (who hold
 * a session token, not a login) would be bounced to /login. */
export const PROTECTED_PREFIXES = ["/dashboard", "/v2"];

/** PUBLIC token-authed v2 surfaces (mount PublicAppLayout, no AuthProvider). These start with
 * `/v2` so they match PROTECTED_PREFIXES — the proxy + AuthProvider MUST skip the login gate for
 * them. The per-session token in the query string is the auth. */
export const PUBLIC_V2_PREFIXES = [
  "/v2/booking",
  "/v2/contracts-sign",
  "/v2/client-image-session",
];

/** Routes that should redirect away when already logged in. */
export const AUTH_ROUTES = ["/login", "reset"];

export const ZINDEXS = {
  TOAST: 50,
  TOASTLOADINGOVERLAY: 40,
  DIALOG: 100,
  LOADINGOVERLAY: 150,
  OVERLAY: 200,
};

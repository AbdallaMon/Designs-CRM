export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "access_token";

/** Routes that require a logged-in session. */
export const PROTECTED_PREFIXES = ["/dashboard"];

/** Routes that should redirect away when already logged in. */
export const AUTH_ROUTES = ["/login", "reset"];

export const ZINDEXS = {
  TOAST: 50,
  TOASTLOADINGOVERLAY: 40,
  DIALOG: 100,
  LOADINGOVERLAY: 150,
  OVERLAY: 200,
};

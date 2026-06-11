// Open-redirect guard for the public login flow.
//
// The post-login destination is read from the attacker-controllable `?redirect=` query param.
// Because /login is public, an unauthenticated attacker can craft `?redirect=https://evil.com`
// or the scheme-relative `?redirect=//evil.com` (and backslash variants browsers normalize to
// `//`) to turn our trusted login URL into a phishing/open-redirect primitive.
//
// Only honor SAME-ORIGIN, RELATIVE paths. Anything absolute, scheme-relative (`//`), or
// backslash-prefixed (`/\`) falls back to the dashboard. Must run client-side (uses
// window.location.origin).
export function safeRedirect(raw, fallback = "/v2/dashboard") {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback;
  }
  try {
    const u = new URL(raw, window.location.origin);
    return u.origin === window.location.origin
      ? u.pathname + u.search + u.hash
      : fallback;
  } catch {
    return fallback;
  }
}

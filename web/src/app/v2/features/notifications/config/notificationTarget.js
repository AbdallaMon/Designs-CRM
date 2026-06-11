// notificationTarget — derive a single, NEXT-routable target path for a notification row.
//
// A notification carries its destination in one of two shapes:
//   • a `link` / `href` field (often an ABSOLUTE legacy URL, e.g.
//     "http://localhost:3000/dashboard/deals/48"), and/or
//   • an HTML `content` string with an anchor: `<a href="...">#48</a>`.
//
// Clicking must navigate via the Next router, so we MUST hand the router a RELATIVE,
// same-origin path. Absolute same-origin URLs are stripped to their path+query+hash
// (the legacy `/dashboard/*` paths then hit the redirect shells → `/v2/*`). Cross-origin
// or non-navigational hrefs (mailto:, tel:, external sites) are rejected (return null) so
// we never push a foreign URL into the SPA router.
//
// Single-language Arabic / RTL (no user-facing strings here — pure URL logic).

// Pull the first `href` out of an HTML string without a DOM dependency (runs SSR-safe).
function firstAnchorHref(html) {
  if (typeof html !== "string" || html.indexOf("<a") === -1) return null;
  const m = html.match(/<a\b[^>]*?\shref\s*=\s*("([^"]*)"|'([^']*)')/i);
  return m ? m[2] ?? m[3] ?? null : null;
}

// Normalize a raw href to a relative, same-origin path the Next router can push.
// Returns null when the href is empty, cross-origin, or non-navigational.
export function normalizeToRelativePath(raw) {
  if (!raw || typeof raw !== "string") return null;
  const href = raw.trim();
  if (!href) return null;

  // Already a root-relative path — use as-is.
  if (href.startsWith("/")) return href;

  // Reject obvious non-navigational schemes (mailto:, tel:, javascript:, #fragment-only).
  if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return null;

  // Absolute URL — keep only if same-origin, then strip the origin to a relative path.
  if (/^https?:\/\//i.test(href)) {
    try {
      const base =
        typeof window !== "undefined" && window.location
          ? window.location.origin
          : undefined;
      const url = new URL(href, base);
      // Same-origin only (when we can compare). If there's no window (SSR), keep the
      // path of any http(s) URL — the click handler re-validates on the client anyway.
      if (base && url.origin !== base) return null;
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return null;
    }
  }

  // Anything else (relative-without-leading-slash, unknown scheme) — not safe to route.
  return null;
}

// Resolve the best target path for a notification: prefer the explicit link/href field,
// else the first anchor inside the HTML content. Returns a relative path or null.
export function notificationTargetHref(notification) {
  if (!notification) return null;
  const explicit = normalizeToRelativePath(
    notification.link || notification.href,
  );
  if (explicit) return explicit;
  return normalizeToRelativePath(firstAnchorHref(notification.content));
}

export { firstAnchorHref };

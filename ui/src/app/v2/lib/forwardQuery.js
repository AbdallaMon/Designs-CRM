// Cutover Step C helper — shared query-string forwarding for the legacy redirect shells.
//
// The legacy public paths (/contracts, /image-session, /booking, /dashboard, ...) are kept
// alive as thin server-component redirect shells because FROZEN backend services bake
// `${OLDORIGIN}/<legacy-path>?...` links into already-issued PDFs, emails and Telegram
// messages. Each shell must forward the incoming query (token, lng, googleAuth*, ...) verbatim
// to its /v2/* equivalent.
//
// Next 16: `searchParams` is an already-awaited plain object whose values are
// `string | string[] | undefined`. This flattens it into a leading-"?" query string (or an
// empty string when there is nothing to forward), preserving repeated/array-valued params and
// dropping null/undefined values.
export function buildForwardedQuery(searchParamsObject) {
  const sp = searchParamsObject ?? {};
  const qs = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((x) => [k, x]) : v != null ? [[k, v]] : [],
    ),
  ).toString();
  return qs ? `?${qs}` : "";
}

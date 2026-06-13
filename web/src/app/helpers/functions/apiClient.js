// Central /v2 client used by master's data-layer functions (getData / getDataAndSet /
// handleRequestSubmit). The migrated backend mounts ONLY at `/v2`, sets `access_token` /
// `refresh_token` cookies, and returns the envelope `{ success, message, data,
// translationKey }`. Master's UI was written against the old flat backend, so these
// helpers (a) point at the `/v2` base, (b) transparently refresh the access token on 401,
// and (c) normalize the envelope back into the flat shape master's consumers expect.

// `NEXT_PUBLIC_API` = e.g. http://localhost:4000/v2  (NEXT_PUBLIC_URL stays the bare origin
// for sockets / file links). Falls back to `${NEXT_PUBLIC_URL}/v2` if API is unset.
export const API_BASE =
  process.env.NEXT_PUBLIC_API ||
  `${process.env.NEXT_PUBLIC_URL || ""}/v2`;

// Single in-flight refresh shared across all callers (prevents a refresh storm when many
// requests 401 at once).
let _refreshPromise = null;
async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      _refreshPromise = null;
    });
  return _refreshPromise;
}

// Low-level request: prepends the /v2 base, always sends cookies, retries ONCE after a
// successful token refresh on 401. `path` is relative (no leading /v2), query already built.
export async function apiRequest(path, opts = {}, _retry = true) {
  const url = `${API_BASE}/${String(path).replace(/^\//, "")}`;
  const response = await fetch(url, { credentials: "include", ...opts });
  if (response.status === 401 && _retry && !opts._skipRefresh) {
    const ok = await refreshAccessToken();
    if (ok) return apiRequest(path, { ...opts, _skipRefresh: true }, false);
  }
  return response;
}

// Detects the paginated envelope shape `data: { items, total, page, pageSize }` (decision
// #2) so getData can re-expose it as master's flat `{ data, total, totalPages, page }`.
function isPaginatedData(d) {
  return (
    d &&
    typeof d === "object" &&
    !Array.isArray(d) &&
    Array.isArray(d.items) &&
    ("total" in d || "pageSize" in d)
  );
}

// Turns a parsed /v2 envelope `body` + http `status` into the FLAT shape master's
// useDataFetcher / getData consumers read: `{ status, data, total, totalPages, page,
// extraData, message, success, translationKey }`.
export function normalizeEnvelope(body, status) {
  const out = { status };
  if (!body || typeof body !== "object") {
    out.data = body;
    return out;
  }
  out.success = body.success;
  out.message = body.message;
  out.translationKey = body.translationKey;

  const d = body.data;
  if (isPaginatedData(d)) {
    const pageSize = d.pageSize ?? d.limit;
    out.data = d.items;
    out.total = d.total ?? d.items.length;
    out.page = d.page;
    out.totalPages =
      d.totalPages ?? (pageSize ? Math.ceil((d.total ?? 0) / pageSize) : 0);
    out.extraData = d.extraData ?? body.extraData;
  } else {
    // Non-paginated: payload sits under `data`. Keep any flat meta the BE still sends.
    out.data = d !== undefined ? d : body.data;
    out.total = body.total ?? d?.total;
    out.totalPages = body.totalPages ?? d?.totalPages;
    out.extraData = body.extraData ?? d?.extraData;
  }
  return out;
}

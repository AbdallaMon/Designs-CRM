// Central /v2 client used by master's data-layer functions (getData / getDataAndSet /
// handleRequestSubmit). The migrated backend mounts ONLY at `/v2`, sets `access_token` /
// `refresh_token` cookies, and returns the envelope `{ success, message, data,
// translationKey }`. Master's UI was written against the old flat backend, so these
// helpers (a) point at the `/v2` base, (b) transparently refresh the access token on 401,
// and (c) normalize the envelope back into the flat shape master's consumers expect.

// `NEXT_PUBLIC_API` = the backend origin, e.g. http://localhost:4001 (no version prefix —
// the API is mounted at the root). `NEXT_PUBLIC_URL` is the same bare origin, also used for
// sockets / file links. Falls back to NEXT_PUBLIC_URL if API is unset.
// Strip any trailing slash so we never build `https://host//files/chunks` — a double slash
// makes some proxies (Coolify/Traefik) issue a normalizing 30x redirect, which downgrades a
// chunk POST to GET and 404s ("Route not found: GET /files/chunks").
const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API ||
  process.env.NEXT_PUBLIC_URL ||
  ""
).replace(/\/+$/, "");
export const API_BASE = API_ORIGIN.endsWith("/v2")
  ? API_ORIGIN
  : `${API_ORIGIN}/v2`;

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_FAILURE_CODE = "FORBIDDEN";
const CSRF_MISMATCH_REASON = "csrf token mismatch";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const FORCE_FRESH_CSRF_PATHS = new Set(["auth/logout"]);
const COOKIE_INDEPENDENT_AUTH_PATHS = new Set([
  "auth/login",
  "auth/request-password-reset",
  "auth/reset-password",
]);

let _csrfToken = null;
let _csrfPromise = null;
let _refreshPromise = null;

function canonicalAssetReference(value) {
  if (typeof value !== "string") return value;
  if (value.startsWith("/uploads/")) return value.split(/[?#]/, 1)[0];
  const marker = "/v2/files/content/";
  if (!value.startsWith(marker) && !/^https?:\/\//i.test(value)) return value;
  try {
    const parsed = new URL(value, "http://asset.local");
    if (!parsed.pathname.startsWith(marker)) return value;
    const key = parsed.pathname
      .slice(marker.length)
      .split("/")
      .map(decodeURIComponent)
      .join("/");
    return key && !key.split("/").some((part) => !part || part === "." || part === "..")
      ? `/uploads/${key}`
      : value;
  } catch {
    return value;
  }
}

function canonicalizeAssetReferences(value) {
  if (typeof value === "string") return canonicalAssetReference(value);
  if (Array.isArray(value)) return value.map(canonicalizeAssetReferences);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, canonicalizeAssetReferences(item)]),
  );
}

function canonicalizeJsonBody(fetchOptions) {
  if (typeof fetchOptions.body !== "string") return fetchOptions;
  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.get("content-type")?.includes("application/json")) return fetchOptions;
  try {
    return {
      ...fetchOptions,
      body: JSON.stringify(canonicalizeAssetReferences(JSON.parse(fetchOptions.body))),
    };
  } catch {
    return fetchOptions;
  }
}

function browserCookie(name) {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

async function csrfToken({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cookieToken = browserCookie(CSRF_COOKIE_NAME);
    if (cookieToken) {
      _csrfToken = cookieToken;
      return cookieToken;
    }
    if (_csrfToken) return _csrfToken;
  } else {
    _csrfToken = null;
  }
  if (_csrfPromise) return _csrfPromise;

  _csrfPromise = fetch(`${API_BASE}/auth/csrf`, {
    method: "GET",
    credentials: "include",
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const body = await response.json().catch(() => null);
      _csrfToken = body?.data?.csrfToken || null;
      return _csrfToken;
    })
    .catch(() => null)
    .finally(() => {
      _csrfPromise = null;
    });
  return _csrfPromise;
}

async function securedFetchOptions(canonicalPath, opts) {
  const { _skipRefresh, _skipCsrfRetry, ...rawFetchOptions } = opts;
  const fetchOptions = canonicalizeJsonBody(rawFetchOptions);
  const method = String(fetchOptions.method || "GET").toUpperCase();
  if (
    !UNSAFE_METHODS.has(method) ||
    COOKIE_INDEPENDENT_AUTH_PATHS.has(canonicalPath)
  ) {
    return fetchOptions;
  }

  const token = await csrfToken({
    forceRefresh: FORCE_FRESH_CSRF_PATHS.has(canonicalPath),
  });
  if (!token) return fetchOptions;
  const headers = new Headers(fetchOptions.headers || {});
  headers.set("x-csrf-token", token);
  return { ...fetchOptions, headers };
}

async function isCsrfTokenMismatch(response) {
  if (response.status !== 403) return false;
  const body = await response.clone().json().catch(() => null);
  return (
    (body?.code === CSRF_FAILURE_CODE || body?.message === CSRF_FAILURE_CODE) &&
    body?.reason === CSRF_MISMATCH_REASON
  );
}

async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = csrfToken()
    .then((token) =>
      fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: token ? { "x-csrf-token": token } : undefined,
      }),
    )
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      _refreshPromise = null;
    });
  return _refreshPromise;
}

// Low-level request: maps the legacy path → its /v2 module path, prepends the /v2 base,
// always sends cookies, attaches CSRF to cookie-authenticated mutations, and retries once.
export async function apiRequest(path, opts = {}, _retry = true) {
  const canonicalPath = String(path).replace(/^\/?(?:v2\/)?/, "");
  const url = `${API_BASE}/${canonicalPath}`;
  const fetchOptions = await securedFetchOptions(canonicalPath, opts);
  const response = await fetch(url, {
    credentials: "include",
    ...fetchOptions,
  });
  if (!opts._skipCsrfRetry && (await isCsrfTokenMismatch(response))) {
    const token = await csrfToken({ forceRefresh: true });
    if (token) {
      return apiRequest(path, { ...opts, _skipCsrfRetry: true }, _retry);
    }
  }
  if (response.status === 401 && _retry && !opts._skipRefresh) {
    const ok = await refreshAccessToken();
    if (ok) return apiRequest(path, { ...opts, _skipRefresh: true }, false);
  }
  return response;
}

// Detects the paginated envelope shape `data: { items, total, page, pageSize }` (decision
// #2) so getData can re-expose it as master's flat `{ data, total, totalPages, page }`.
function isPaginatedData(d) {
  // Any envelope whose `data` is `{ items: [...] }` is a list — unwrap it to the array,
  // whether or not it carries pagination meta (total/pageSize). Master's consumers expect
  // `res.data` to be the array.
  return (
    d &&
    typeof d === "object" &&
    !Array.isArray(d) &&
    Array.isArray(d.items)
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

// The courses UI predates the uniform response helpers and historically treated
// `status === 200` as the only success signal. Create endpoints correctly return 201,
// so keep the real status in `httpStatus` while exposing a legacy-compatible status.
export function normalizeMutationResult(body, httpStatus) {
  const responseBody = body && typeof body === "object" ? body : { data: body };
  const success =
    httpStatus >= 200 && httpStatus < 300 && responseBody.success !== false;
  return {
    ...responseBody,
    success,
    ok: success,
    httpStatus,
    status: success ? 200 : httpStatus,
  };
}

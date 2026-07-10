import { apiRequest, normalizeEnvelope } from "./apiClient";
import { describeApiError } from "./richError";

// Reads a (optionally paginated) list/detail from the /v2 backend and returns master's
// FLAT shape (`{ status, data, total, totalPages, page, extraData, message }`). The /v2
// base, cookie auth, token-refresh and envelope-unwrapping live in apiClient, so master's
// consumers (useDataFetcher, direct callers) keep reading the same fields.
//
// On a failed request (non-2xx, incl. 401/403) the normalized result additionally carries
// `error: describeApiError(body)` — the resolved denial reason + any explained-redirect
// metadata — so a page can render "no access: <reason>" instead of a silent empty state.
// The success-path shape is untouched.
export async function getData({
  url = "",
  setLoading,
  page,
  limit,
  filters,
  search,
  sort,
  others,
}) {
  try {
    if (!url) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let queryPrefix = "?";
    if (url.endsWith("&")) {
      queryPrefix = "";
    }
    if (url.includes("?")) {
      queryPrefix = "&";
    }
    // Only serialize params that were actually supplied. Emitting `page=undefined`
    // (etc.) sends the literal string "undefined", which defeats server-side
    // `z.coerce.number().default(1)` (Number("undefined") is NaN, not missing) and
    // 422s every paginated endpoint the caller didn't pass page/limit to.
    const parts = [];
    if (page !== undefined) parts.push(`page=${page}`);
    if (limit !== undefined) parts.push(`limit=${limit}`);
    if (filters !== undefined) parts.push(`filters=${JSON.stringify(filters)}`);
    if (search !== undefined) parts.push(`search=${search}`);
    if (sort !== undefined) parts.push(`sort=${JSON.stringify(sort)}`);
    if (others) parts.push(others);
    const query = parts.join("&");
    const path = query ? `${url}${queryPrefix}${query}` : url;

    const response = await apiRequest(path, {
      headers: { "Content-Type": "application/json" },
    });
    const status = response.status;
    let body;
    try {
      body = await response.json();
    } catch {
      body = { message: response.statusText };
    }
    const result = normalizeEnvelope(body, status);
    if (!response.ok || status === 401 || status === 403) {
      result.error = describeApiError(body);
    }
    return result;
  } catch (e) {
    console.log(e);
  } finally {
    setLoading(false);
  }
}

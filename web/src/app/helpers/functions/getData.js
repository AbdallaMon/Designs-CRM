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
    const path = `${url}${queryPrefix}page=${page}&limit=${limit}&filters=${JSON.stringify(
      filters
    )}&search=${search}&sort=${JSON.stringify(sort)}&${others}`;

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

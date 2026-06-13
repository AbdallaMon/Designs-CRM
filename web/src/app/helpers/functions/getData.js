import { apiRequest, normalizeEnvelope } from "./apiClient";

// Reads a (optionally paginated) list/detail from the /v2 backend and returns master's
// FLAT shape (`{ status, data, total, totalPages, page, extraData, message }`). The /v2
// base, cookie auth, token-refresh and envelope-unwrapping live in apiClient, so master's
// consumers (useDataFetcher, direct callers) keep reading the same fields.
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
    return normalizeEnvelope(body, status);
  } catch (e) {
    console.log(e);
  } finally {
    setLoading(false);
  }
}

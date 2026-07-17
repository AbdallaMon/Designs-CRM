import { apiRequest, normalizeEnvelope } from "./apiClient";
import { describeApiError } from "./richError";

// Same as getData, but pushes the payload straight into a caller-supplied setter and
// throws (optionally) on auth/explicit failures. Talks to /v2 via apiClient and unwraps
// the envelope back into master's flat shape.
export async function getDataAndSet({
  url = "",
  setLoading,
  setData,
  setError,
  page,
  limit,
  filters,
  search,
  sort,
  others,
  withError,
}) {
  try {
    setLoading(true);
    let queryPrefix = "?";
    if (url.endsWith("&")) {
      queryPrefix = "";
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
    if (status === 200) {
      if (setData) {
        setData(result.data);
      }
    } else if (
      body?.success === false ||
      status === 401 ||
      status === 403 ||
      status === 419 ||
      status === 440 ||
      status === 498
    ) {
      result.error = describeApiError(body);
      const error = new Error(result.error.message || "Unauthorized");
      error.redirectTo = result.error.redirectTo;
      error.redirectText = result.error.redirectText;
      error.dontRedirect = result.error.dontRedirect;
      throw error;
    }
    return result;
  } catch (e) {
    if (setError) {
      setError(e.message);
    }
    if (withError) {
      throw e.message;
    }
  } finally {
    setLoading(false);
  }
}

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

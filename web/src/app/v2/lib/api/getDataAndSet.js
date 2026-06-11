import apiFetch, { legacyApiFetch } from "./ApiFetch";

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
  legacy = false,
}) {
  try {
    setLoading(true);

    const result = await (legacy ? legacyApiFetch : apiFetch).getPaginated(
      url,
      {
        page,
        limit,
        filters,
        search,
        sort,
        others,
      },
    );

    if (result.status === 200) {
      if (setData) setData(result.data);
    }

    return result;
  } catch (e) {
    const message = e.message;
    if (setError) setError(message);
    console.error("[getDataAndSet]", e);
    return { status: 500, message };
  } finally {
    setLoading(false);
  }
}

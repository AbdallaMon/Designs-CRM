import apiFetch, { legacyApiFetch } from "./ApiFetch";

export async function getData({
  url = "",
  setLoading,
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

    return result;
  } catch (e) {
    console.error("[getData]", e);
    return { status: 500, message: e.message };
  } finally {
    setLoading(false);
  }
}

import apiFetch from "./ApiFetch";

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

    const result = await apiFetch.getPaginated(
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

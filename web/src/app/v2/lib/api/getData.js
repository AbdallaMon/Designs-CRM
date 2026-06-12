import { resolveMessage } from "@/app/v2/lib/messages/resolveMessage";
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
    return {
      status: e?.status || 500,
      message: resolveMessage(e?.data?.message || e?.message),
    };
  } finally {
    setLoading(false);
  }
}

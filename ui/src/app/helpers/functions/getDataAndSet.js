import { getDataAndSet as getDataAndSetV2 } from "../../v2/lib/api/getDataAndSet";
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
  return await getDataAndSetV2({
    url,
    setLoading,
    setData,
    setError,
    page,
    limit,
    filters,
    search,
    sort,
    others,
    legacy: true,
  });
  try {
    setLoading(true);
    let queryPrefix = "?";
    if (url.endsWith("&")) {
      queryPrefix = "";
    }
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_URL
      }/${url}${queryPrefix}page=${page}&limit=${limit}&filters=${JSON.stringify(
        filters,
      )}&search=${search}&sort=${JSON.stringify(sort)}&${others}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );
    const status = response.status;
    const result = await response.json();
    if (status === 200) {
      if (setData) {
        setData(result.data);
      }
    } else {
      if (
        result?.success === false ||
        status === 401 ||
        status === 403 ||
        status === 419 ||
        status === 440 ||
        status === 498
      ) {
        throw new Error(result.message || "Unauthorized");
      }
    }
    result.status = status;
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

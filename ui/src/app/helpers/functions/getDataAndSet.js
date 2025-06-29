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
}) {
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
        filters
      )}&search=${search}&sort=${JSON.stringify(sort)}&${others}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    const status = response.status;
    const result = await response.json();
    if (status === 200) {
      setData(result.data);
    }
    result.status = status;
    return result;
  } catch (e) {
    if (setError) {
      setError(e.message);
    }
    console.log(e);
  } finally {
    setLoading(false);
  }
}

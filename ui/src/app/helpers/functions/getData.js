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
        let queryPrefix = "?"
        if (url.endsWith("&")) {
            queryPrefix = ""
        }
        const response = await fetch(
              `${process.env.NEXT_PUBLIC_URL}/${url}${queryPrefix}page=${page}&limit=${limit}&filters=${JSON.stringify(filters)}&search=${search}&sort=${JSON.stringify(sort)}&${others}`,
              {
                  headers: {
                      "Content-Type": "application/json",
                  },
                  credentials: 'include',
              },
        );
        const status = response.status;
        const result = await response.json()
        result.status = status;
        return result;
    } catch (e) {
        console.log(e);
    } finally {
        setLoading(false);
    }
}

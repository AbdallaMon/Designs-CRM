import { useCallback, useEffect, useState } from "react";
import { useLoading } from "./useLoading";
import apiFetch from "../lib/api/ApiFetch";

export function useRequest({
  url,
  method = "get",
  isPublic = false,
  isPaginated = false,
  autoFetch = false,
  initialData = null,
  initialParams = undefined,
}) {
  const [data, setData] = useState(initialData);
  const { isLoading, startLoading, stopLoading } = useLoading(autoFetch);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const fetchData = useCallback(
    async (params = initialParams) => {
      startLoading();
      setError(null);
      setSuccessMessage(null);

      try {
        let response;
        const client = isPublic ? apiFetch.public : apiFetch;

        if (method === "get") {
          response = await client[isPaginated ? "getPaginated" : "get"](
            url,
            params,
          );
        } else {
          response = await client[method](url, params);
        }
        setSuccessMessage(response.message || "Operation successful");
        setData(response.data);
        return response;
      } catch (e) {
        const message =
          e?.data?.message || e?.message || "Something went wrong";

        setError(message);
        throw e;
      } finally {
        stopLoading();
      }
    },
    [
      url,
      method,
      isPublic,
      isPaginated,
      initialParams,
      startLoading,
      stopLoading,
    ],
  );
  const clearError = useCallback(() => setError(null), []);
  useEffect(() => {
    if (autoFetch && method === "get") {
      fetchData();
    }
  }, [autoFetch, method, fetchData]);

  return {
    data,
    setData,
    isLoading,
    error,
    fetchData,
    refetch: fetchData,
    clearError,
    successMessage,
  };
}

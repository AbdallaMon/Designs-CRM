"use client";

// Tiny lazy-fetch helper for per-tab / per-section reads in the courses editors and learner
// screens. Each detail tab/section mounts ONLY when active, so the fetch runs on first mount —
// lazy per-tab fetching. Calls a courses/staffCourses SERVICE thunk, surfaces the five states'
// inputs (loading / error / data) + a refetch. Single-resource (not the paginated list hook).
// A verbatim sibling of features/usersDetails/hooks/useLazyResource.js (kept local so the
// courses feature owns its hooks).

import { useCallback, useEffect, useState } from "react";

export function useLazyResource(fetchFn, { autoFetch = true, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      setData(res?.data ?? null);
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      return null;
    } finally {
      setIsLoading(false);
    }
    // fetchFn identity is owned by the caller via `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (autoFetch) run();
  }, [autoFetch, run]);

  return { data, setData, isLoading, error, refetch: run };
}

export default useLazyResource;

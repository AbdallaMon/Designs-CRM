"use client";

// Tiny lazy-fetch helper for the per-tab admin reads (logs / last-seen / restricted-countries
// / auto-assignments / staff-extra). Each detail tab is rendered ONLY when active (the page
// mounts the active panel only), so the fetch runs on first mount of the tab — lazy per-tab
// fetching (UX plan §3.8 capability-driven states). Calls the users SERVICE, surfaces the five
// states' inputs (loading / error / data) and a refetch. Not the list hook — single-resource.

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

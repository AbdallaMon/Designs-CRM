"use client";
import { useEffect, useState } from "react";
import { getData } from "@/app/helpers/functions/getData";

/* ----------------------------------------------------------------------------
 * Single counts source. ONE call to `shared/client-leads/summary?staffId=<id>`
 * returns `{ new, nonConsulted, stale, calls, meetings }`. These counts feed
 * BOTH the KPI rail and the tab/section badges. Refetches whenever `token`
 * changes (the page bumps it from the refresh button).
 * -------------------------------------------------------------------------- */
export const EMPTY_SUMMARY = {
  new: 0,
  nonConsulted: 0,
  stale: 0,
  calls: 0,
  meetings: 0,
};

export function useSummary(staffId, token) {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      const res = await getData({
        url: `shared/client-leads/summary?staffId=${staffId}&`,
        setLoading,
        // getData appends pagination params; the summary endpoint ignores them.
        page: 1,
        limit: 1,
        filters: {},
        search: "",
        sort: {},
        others: "",
      });
      if (!alive) return;
      if (res && res.status === 200 && res.data && typeof res.data === "object") {
        setSummary({ ...EMPTY_SUMMARY, ...res.data });
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [staffId, token]);

  return { summary, loading };
}

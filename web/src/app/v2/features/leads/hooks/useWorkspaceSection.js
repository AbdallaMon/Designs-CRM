"use client";

// Per-section fetch for the Leads Workspace cockpit. Each of the 4 cards (calls, meetings,
// new leads, on-hold deals) owns its OWN request so one failing read never blanks the whole
// page (mirrors the dashboard WidgetBoundary / useDashboardWidget isolation). Calls the leads
// SERVICE (never apiFetch directly) and consumes the §5c list envelope
// `data: { items, total, page, pageSize }`. A 403 is surfaced distinctly (forbidden:true) so
// the card can render a gentle partial-permission notice instead of a generic error.

import { useCallback, useEffect, useState } from "react";

const PREVIEW_LIMIT = 8;

/**
 * @param {object}   opts
 * @param {Function} opts.fetcher  () => Promise<envelope> — a leadsService call bound to its args.
 * @param {boolean}  opts.enabled  gate — autoFetch only when the permission passes.
 */
export function useWorkspaceSection({ fetcher, enabled = true }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const [forbidden, setForbidden] = useState(false);

  const fetchSection = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const res = await fetcher();
      const data = res?.data ?? {};
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total) || 0);
      return res;
    } catch (e) {
      const status = e?.status ?? e?.data?.statusCode;
      if (status === 403) setForbidden(true);
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setItems([]);
      setTotal(0);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (enabled) fetchSection();
    // fetcher identity is owned by the caller (bound per render); enabled gates it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetchSection]);

  return { items, total, isLoading, error, forbidden, refetch: fetchSection };
}

export { PREVIEW_LIMIT };
export default useWorkspaceSection;

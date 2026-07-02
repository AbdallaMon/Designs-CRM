"use client";
// Per-tab data layer for the lead / deal detail.
//
// The lead detail used to fetch ONE big bundle (`shared/client-leads/:id`) and every
// tab read its slice from that object. This provider splits that into:
//   • a CORE/shared lead (identity, status, contract, payment, projects…) that the
//     header + the Details tab + several tabs always need — fetched once by PreviewLead
//     and handed in here as `lead` / `setLead`;
//   • per-tab slices (notes, calls, meetings, files, price-offers) that each tab fetches
//     LAZILY on first open, then keeps CACHED — so switching away and back does NOT refetch.
//
// A mutation on a tab calls `onMutated(...)` (exposed via useLeadTab): it writes the
// optimistic change into the cache, silently refetches that tab from the server to
// reconcile, and bumps the kanban column the lead sits in so the board reflects the change.
//
// Endpoints (additive BE reads — see server lead.routes.js):
//   GET shared/client-leads/:id/{notes,call-reminders,meetings,files,price-offers}
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiRequest, normalizeEnvelope } from "@/app/helpers/functions/apiClient";

// tab key → endpoint. A STRING is a sub-resource appended to the lead base url
// (`shared/client-leads/:id/<string>`). A FUNCTION receives the lead id and returns
// a FULL path, for tabs whose resource does not hang off the lead base url.
const TAB_ENDPOINTS = {
  notes: "notes",
  calls: "call-reminders",
  meetings: "meetings",
  files: "files",
  priceOffers: "price-offers",
  salesStage: (leadId) => `shared/sales-stages/${leadId}`,
};

const EMPTY_TAB = { data: undefined, loading: false, loaded: false, error: null };

const LeadDetailsContext = createContext(null);

export function LeadDetailsProvider({
  children,
  lead,
  setLead,
  leadBaseUrl, // e.g. `shared/client-leads/123`
  setRerenderColumns, // kanban column re-render toggles (absent in full-page mode)
}) {
  // per-tab cache: { [key]: { data, loading, loaded, error } }
  const [tabs, setTabs] = useState({});
  // in-flight guard so a remount (TabPanel unmounts inactive tabs) can't double-fetch.
  const inFlight = useRef({});
  // a refetch requested while a fetch for the same key is in-flight is recorded here and
  // replayed once the in-flight fetch settles — so a post-mutation reconcile is never dropped.
  const pendingRefetch = useRef({});
  // always-fresh handle to the base url for callbacks created once.
  const baseUrlRef = useRef(leadBaseUrl);
  baseUrlRef.current = leadBaseUrl;
  // lead id, for function-form endpoints that build a full (non-sub-resource) path.
  const leadIdRef = useRef(lead?.id);
  leadIdRef.current = lead?.id;

  const getTab = useCallback((key) => tabs[key] || EMPTY_TAB, [tabs]);

  const doFetch = useCallback(async (key, opts = {}) => {
    const { silent = false } = opts;
    const endpoint = TAB_ENDPOINTS[key];
    if (!endpoint) return;
    // Resolve the request path: function endpoints build a full path from the lead id;
    // string endpoints are appended to the lead base url.
    const path =
      typeof endpoint === "function"
        ? endpoint(leadIdRef.current)
        : baseUrlRef.current
        ? `${baseUrlRef.current}/${endpoint}`
        : null;
    if (!path) return;
    // A fetch is already running for this key: record this request as a pending rerun
    // (the latest opts win) so it replays when the current fetch settles, instead of
    // being silently dropped.
    if (inFlight.current[key]) {
      pendingRefetch.current[key] = opts;
      return;
    }
    inFlight.current[key] = true;
    setTabs((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || EMPTY_TAB), loading: !silent, error: null },
    }));
    try {
      const res = await apiRequest(path, {
        headers: { "Content-Type": "application/json" },
      });
      let body;
      try {
        body = await res.json();
      } catch {
        body = { message: res.statusText };
      }
      const norm = normalizeEnvelope(body, res.status);
      if (res.status >= 200 && res.status < 300) {
        const data = Array.isArray(norm.data) ? norm.data : norm.data ?? [];
        setTabs((prev) => ({
          ...prev,
          [key]: { data, loading: false, loaded: true, error: null },
        }));
      } else {
        setTabs((prev) => ({
          ...prev,
          [key]: { ...(prev[key] || EMPTY_TAB), loading: false, error: norm.message || "ERROR" },
        }));
      }
    } catch (e) {
      setTabs((prev) => ({
        ...prev,
        [key]: { ...(prev[key] || EMPTY_TAB), loading: false, error: e?.message || "ERROR" },
      }));
    } finally {
      inFlight.current[key] = false;
      // A refetch was requested while this fetch was running — replay it now.
      if (pendingRefetch.current[key]) {
        const rerunOpts = pendingRefetch.current[key];
        delete pendingRefetch.current[key];
        doFetch(key, rerunOpts);
      }
    }
  }, []);

  // Fetch a tab once, lazily. No-op if already loaded or currently loading.
  const ensureTab = useCallback(
    (key) => {
      const t = tabs[key];
      if (t?.loaded || t?.loading || inFlight.current[key]) return;
      doFetch(key);
    },
    [tabs, doFetch]
  );

  // Force a refetch (used after a mutation). `silent` keeps the cached data visible
  // (no spinner) while reconciling with the server.
  const refetchTab = useCallback((key, opts) => doFetch(key, opts), [doFetch]);

  // Optimistic local write into a tab's cache (the existing dialogs call the tab's
  // setter with a `(prev) => next` updater after a successful request).
  const setTabData = useCallback((key, updater) => {
    setTabs((prev) => {
      const current = prev[key]?.data ?? [];
      const next = typeof updater === "function" ? updater(current) : updater;
      return {
        ...prev,
        [key]: { ...(prev[key] || EMPTY_TAB), data: next, loaded: true },
      };
    });
  }, []);

  // Bump the kanban column the lead currently sits in (and an optional extra status,
  // e.g. the old column on a status move) so the board re-renders after a mutation.
  const refreshKanban = useCallback(
    (extraStatus) => {
      if (!setRerenderColumns) return;
      setRerenderColumns((prev) => {
        const next = { ...prev };
        const s = lead?.status;
        if (s) next[s] = !prev?.[s];
        if (extraStatus && extraStatus !== s) next[extraStatus] = !prev?.[extraStatus];
        return next;
      });
    },
    [setRerenderColumns, lead?.status]
  );

  // Re-pull the CORE/shared lead (header + Details tab) — used after a shared-field
  // change (status, price, assignment) so the header reflects it without a full reload.
  const refetchCore = useCallback(async () => {
    if (!baseUrlRef.current || !setLead) return;
    try {
      const res = await apiRequest(baseUrlRef.current, {
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      const norm = normalizeEnvelope(body, res.status);
      if (res.status >= 200 && res.status < 300 && norm.data) setLead(norm.data);
    } catch {
      /* non-fatal: header keeps its current values */
    }
  }, [setLead]);

  const value = useMemo(
    () => ({
      lead,
      setLead,
      leadId: lead?.id,
      getTab,
      ensureTab,
      refetchTab,
      setTabData,
      refreshKanban,
      refetchCore,
    }),
    [lead, setLead, getTab, ensureTab, refetchTab, setTabData, refreshKanban, refetchCore]
  );

  return (
    <LeadDetailsContext.Provider value={value}>{children}</LeadDetailsContext.Provider>
  );
}

export function useLeadDetails() {
  return useContext(LeadDetailsContext);
}

// Convenience hook for a single tab. Provider-optional by design:
//   • UNDER the LeadDetailsProvider (the lead/deal detail) it lazily fetches the tab's
//     slice on first open, keeps it CACHED across tab switches, and exposes `onMutated`
//     — a single hook that writes the optimistic change, silently refetches to reconcile
//     with the server, and bumps the kanban column. `showLoading` drives the first-load
//     spinner.
//   • WITHOUT a provider (e.g. the work-stage preview reuses these tab components) it
//     falls back to plain local state seeded from `fallback` (the `lead.<slice>` prop),
//     so those screens keep their original behavior untouched.
//
// `fallback` is the slice the tab used to read from the bundle (e.g. `lead.notes`).
export function useLeadTab(key, { fallback } = {}) {
  const ctx = useLeadDetails();
  const hasProvider = Boolean(ctx);

  // Local fallback state — only meaningful when there is no provider.
  const [localData, setLocalData] = useState(fallback ?? []);
  useEffect(() => {
    if (!hasProvider) setLocalData(fallback ?? []);
  }, [hasProvider, fallback]);

  // Provider path: trigger the lazy fetch on mount / lead change.
  useEffect(() => {
    if (hasProvider) ctx.ensureTab(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hasProvider, ctx?.leadId]);

  if (!hasProvider) {
    return {
      data: localData ?? [],
      loading: false,
      loaded: true,
      error: null,
      lead: undefined,
      setData: setLocalData,
      onMutated: setLocalData,
      refetch: () => {},
      refreshKanban: () => {},
      refetchCore: () => {},
      showLoading: false,
    };
  }

  const state = ctx.getTab(key);
  return {
    data: state.data ?? [],
    loading: state.loading,
    loaded: state.loaded,
    error: state.error,
    lead: ctx.lead,
    setData: (updater) => ctx.setTabData(key, updater),
    // The single mutation hook: optimistic cache write (if an updater is given) →
    // silent refetch to reconcile → kanban bump. Pass this where a tab previously
    // passed its `setXxx` state setter; dialogs call it with a `(prev) => next` updater.
    onMutated: (updater) => {
      if (updater !== undefined) ctx.setTabData(key, updater);
      ctx.refetchTab(key, { silent: true });
      ctx.refreshKanban();
    },
    refetch: (opts) => ctx.refetchTab(key, opts),
    refreshKanban: ctx.refreshKanban,
    refetchCore: ctx.refetchCore,
    showLoading: !state.loaded && !state.error,
  };
}

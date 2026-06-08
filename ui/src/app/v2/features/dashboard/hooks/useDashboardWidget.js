"use client";

// useDashboardWidget — a thin wrapper over the canonical useRequest for one dashboard read.
// Each dashboard widget owns its own request so failures are ISOLATED (per-widget error+retry,
// UX plan §3.1) and the page never blanks because one of nine aggregations failed.
//
// The shared apiFetch.get ignores a params arg, so scoped reads must bake the query INTO the
// url. We append the scope query SUFFIX here; when `scoped` is false (latest-leads takes no
// args) we pass the bare base url. Because `url` is a dependency of useRequest's fetchData, a
// new scope suffix re-fetches automatically (and the retry is just refetch()).

import { useRequest } from "@/app/v2/hooks/useRequest";

/**
 * @param {object}  opts
 * @param {string}  opts.base    the read's base path (from config/constant.js)
 * @param {string}  opts.query   the scope query suffix ("" or "?startDate=…")
 * @param {boolean} opts.enabled gate — autoFetch only when the permission passes
 * @param {boolean} [opts.scoped=true] whether the read accepts the scope query
 */
export function useDashboardWidget({ base, query, enabled, scoped = true }) {
  const url = scoped ? `${base}${query ?? ""}` : base;
  const { data, isLoading, error, refetch } = useRequest({
    url,
    method: "get",
    autoFetch: Boolean(enabled),
  });
  return { data, isLoading, error, refetch };
}

export default useDashboardWidget;

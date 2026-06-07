"use client";

// List hook for the leads pool. Owns pagination + filter state and calls the leads
// SERVICE (never apiFetch directly). Consumes the §5c list shape
// `data: { items, total, page, pageSize }`. Each item carries backend-computed
// `capabilities.*` which the page/cards gate actions on.

import { useCallback, useEffect, useState } from "react";
import { leadsService } from "../leads.service.js";

const DEFAULT_PAGE_SIZE = 10;

export function useLeadsList({ autoFetch = true, initialExtra = {} } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState("");
  // `extra` carries top-level query params the BE list reads directly (NOT inside the
  // JSON `filters` string) — e.g. `status`, which #buildListWhere reads off the top level.
  // Seeded from `initialExtra`; callers can replace it via setExtra.
  const [extra, setExtra] = useState(initialExtra);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await leadsService.listLeads({
        page,
        limit: pageSize,
        filters,
        search,
        extra,
      });
      // §5c: list shape is { items, total, page, pageSize } under the envelope `data`.
      const data = res?.data ?? {};
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total) || 0);
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setItems([]);
      setTotal(0);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filters, search, extra]);

  useEffect(() => {
    if (autoFetch) fetchLeads();
  }, [autoFetch, fetchLeads]);

  // Reset to page 1 whenever filters or the search term change.
  const applyFilters = useCallback((next) => {
    setPage(1);
    setFilters(next ?? {});
  }, []);
  const applySearch = useCallback((term) => {
    setPage(1);
    setSearch(term ?? "");
  }, []);
  const applyExtra = useCallback((next) => {
    setPage(1);
    setExtra(next ?? {});
  }, []);

  return {
    items,
    setItems,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    setFilters: applyFilters,
    search,
    setSearch: applySearch,
    extra,
    setExtra: applyExtra,
    isLoading,
    error,
    refetch: fetchLeads,
  };
}

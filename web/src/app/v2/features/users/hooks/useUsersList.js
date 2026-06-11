"use client";

// List hook for the admin user-management list. Owns pagination + filter state and calls
// the users SERVICE (never apiFetch directly). Consumes the §5c list shape
// `data: { items, total, page, pageSize }`. Each item carries backend-computed
// `capabilities.*` which the (later) screens gate per-record actions on. Mirrors
// features/leads/hooks/useLeadsList.js.

import { useCallback, useEffect, useState } from "react";
import { usersService } from "../users.service.js";

const DEFAULT_PAGE_SIZE = 10;

export function useUsersList({ autoFetch = true, initialExtra = {} } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState("");
  const [extra, setExtra] = useState(initialExtra);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await usersService.listUsers({
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
    if (autoFetch) fetchUsers();
  }, [autoFetch, fetchUsers]);

  const applyFilters = useCallback((next) => {
    setPage(1);
    setFilters(next ?? {});
  }, []);
  const applySearch = useCallback((term) => {
    setPage(1);
    setSearch(term ?? "");
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
    setExtra,
    isLoading,
    error,
    refetch: fetchUsers,
  };
}

"use client";

// List hook for the admin leads-with-projects aggregation. Owns pagination/filter state and
// calls the adminResidual SERVICE (never apiFetch directly). The BE reads page/limit/filters via
// .passthrough(); the response may be an array or the §5c { items, total, page, pageSize } shape,
// so we normalize both. Mirrors features/users/hooks/useUsersList.js. Arabic / RTL.

import { useCallback, useEffect, useState } from "react";
import { adminResidualService } from "../adminResidual.service.js";

const DEFAULT_PAGE_SIZE = 10;

export function useAdminProjectsList({ autoFetch = true } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page, limit: pageSize };
      const term = String(search ?? "").trim();
      if (term) params.search = term;
      const res = await adminResidualService.listAdminProjects(params);
      const data = res?.data ?? {};
      if (Array.isArray(data)) {
        setItems(data);
        setTotal(data.length);
      } else if (Array.isArray(data.items)) {
        setItems(data.items);
        setTotal(Number(data.total) || data.items.length);
      } else {
        setItems([]);
        setTotal(0);
      }
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setItems([]);
      setTotal(0);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    if (autoFetch) fetchProjects();
  }, [autoFetch, fetchProjects]);

  const applySearch = useCallback((term) => {
    setPage(1);
    setSearch(term ?? "");
  }, []);

  return {
    items,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch: applySearch,
    isLoading,
    error,
    refetch: fetchProjects,
  };
}

"use client";

// List hook for the projects board (designers board OR archived board). Owns pagination
// + filter state and calls the projects SERVICE (never apiFetch directly). Consumes the
// §5c list shape `data: { items, ... }`; the archived surface also returns `total`.
// Each item is a lead carrying `groupedProjects` (designer board) or `projects`, and the
// nested projects carry backend-computed `capabilities.*`.

import { useCallback, useEffect, useState } from "react";
import { projectsService } from "../projects.service.js";

const DEFAULT_PAGE_SIZE = 10;

/**
 * @param {object} opts
 * @param {"designers"|"archived"} [opts.mode]  which board surface to fetch
 * @param {string} [opts.type]  project `type` (department) for the designers board. The
 *   legacy board ALWAYS sent `?type=` and the backend designer query crashes / returns the
 *   wrong rows without it, so the designers board must always carry one. Ignored by the
 *   archived board (the legacy archived query filters on status, not type).
 * @param {boolean} [opts.autoFetch]
 */
export function useProjectBoard({ mode = "designers", type, autoFetch = true } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState({});
  const [extra, setExtra] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBoard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const call =
        mode === "archived" ? projectsService.listArchived : projectsService.listDesigners;
      // The designers board forwards `type` as a top-level query param (parity with the
      // legacy per-type kanban routes). The archived board does not take a type.
      const callExtra =
        mode === "designers" && type ? { ...extra, type } : extra;
      const res = await call({ page, limit: pageSize, filters, extra: callExtra });
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
  }, [mode, type, page, pageSize, filters, extra]);

  useEffect(() => {
    if (autoFetch) fetchBoard();
  }, [autoFetch, fetchBoard]);

  const applyFilters = useCallback((next) => {
    setPage(1);
    setFilters(next ?? {});
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
    extra,
    setExtra: applyExtra,
    isLoading,
    error,
    refetch: fetchBoard,
  };
}

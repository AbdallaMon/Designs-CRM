"use client";

// Generic paginated list hook for the accounting table views (operational-expenses, rents,
// outcome, users). Owns page/limit + an `extra` params bag and calls one accountingService
// list function (never apiFetch directly). Consumes the §5c list shape
// `data: { items, total, page, pageSize }`. Items may carry backend-computed
// `capabilities.*` (rents) which the components gate actions on.

import { useCallback, useEffect, useState } from "react";

const DEFAULT_PAGE_SIZE = 10;

/**
 * @param {(params:object)=>Promise<object>} listFn  an accountingService list helper
 * @param {object} [opts]
 * @param {boolean} [opts.autoFetch]
 * @param {object} [opts.initialExtra]  top-level params (status/filters/staffId/...)
 */
export function usePaginatedList(listFn, { autoFetch = true, initialExtra = {} } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [extra, setExtra] = useState(initialExtra);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listFn({ page, limit: pageSize, ...extra });
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
  }, [listFn, page, pageSize, extra]);

  useEffect(() => {
    if (autoFetch) fetchList();
  }, [autoFetch, fetchList]);

  // Reset to page 1 whenever the extra params change.
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
    extra,
    setExtra: applyExtra,
    isLoading,
    error,
    refetch: fetchList,
  };
}

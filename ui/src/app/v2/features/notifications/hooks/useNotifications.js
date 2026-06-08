"use client";

// Paginated notifications list hook. Owns page/limit and calls the notifications.service list
// helper (never apiFetch directly). Consumes the §5c-normalized list shape
// `data: { items, total, page, pageSize }` (legacy was `{ data, totalPages, total }`). Mirrors
// the accounting usePaginatedList pattern — the established v2 convention for paginated reads
// (the service sends `?page=&limit=` plain query params, matching notification.validation.js's
// listQuery; we do NOT use useRequest's getPaginated, whose filters/search/sort path shape is a
// different, legacy contract).

import { useCallback, useEffect, useState } from "react";

const DEFAULT_PAGE_SIZE = 9; // matches notification.validation.js limit default

/**
 * @param {(params:object)=>Promise<object>} listFn  a notificationsService list helper
 * @param {object} [opts]
 * @param {boolean} [opts.autoFetch]
 */
export function useNotifications(listFn, { autoFetch = true } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listFn({ page, limit: pageSize });
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
  }, [listFn, page, pageSize]);

  useEffect(() => {
    if (autoFetch) fetchList();
  }, [autoFetch, fetchList]);

  return {
    items,
    setItems,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    isLoading,
    error,
    refetch: fetchList,
  };
}

"use client";

// Grouped contract-payments list hook — owns { page, limit, status } and calls
// contractsService.paymentsGrouped (never apiFetch directly). UNLIKE the accounting
// usePaginatedList, the contract-payments envelope `data` is shaped
// `{ items, page, limit, total, totalPages }` (NOTE: `limit`/`totalPages`, NOT `pageSize`) —
// so this is a dedicated local hook that surfaces those keys verbatim. Default status is
// "DUE" (legacy default). Changing the status resets the page to 1. Read every field
// defensively (the BE may omit any of them).

import { useCallback, useEffect, useState } from "react";
import { contractsService } from "../contracts.service.js";

const DEFAULT_LIMIT = 10;

/**
 * @param {object} [opts]
 * @param {boolean} [opts.autoFetch]  fetch on mount / on dependency change (gate on PAYMENT_LIST).
 * @param {string}  [opts.initialStatus]  DUE | RECEIVED | TRANSFERRED | NOT_DUE | ALL.
 */
export function useContractPayments({ autoFetch = true, initialStatus = "DUE" } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [status, setStatusState] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await contractsService.paymentsGrouped({ page, limit, status });
      const data = res?.data ?? {};
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total) || 0);
      setTotalPages(Number(data.totalPages) || 1);
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    if (autoFetch) fetchList();
  }, [autoFetch, fetchList]);

  // Reset to page 1 whenever the status filter changes.
  const setStatus = useCallback((next) => {
    setPage(1);
    setStatusState(next);
  }, []);

  return {
    items,
    total,
    totalPages,
    page,
    setPage,
    limit,
    setLimit,
    status,
    setStatus,
    isLoading,
    error,
    refetch: fetchList,
  };
}

export default useContractPayments;

"use client";

// Board hook for the payments kanban (the main accountant payments screen + the read-only
// 3d-status board). The legacy main board fetched `status=NOT_PAID`, which the BE list
// treats specially: it returns ALL not-paid payments (PENDING/OVERDUE/PARTIALLY_PAID)
// WITHOUT pagination, so the columns can be filled client-side by paymentLevel (or by the
// lead's threeDWorkStage for the 3d board). We preserve that exactly. Calls the accounting
// SERVICE only.

import { useCallback, useEffect, useState } from "react";
import { accountingService } from "../accounting.service.js";

export function usePaymentsBoard({ autoFetch = true, clientId } = {}) {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBoard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // status=NOT_PAID → BE returns all not-paid payments unpaginated.
      const res = await accountingService.listPayments({ status: "NOT_PAID", clientId });
      const data = res?.data ?? {};
      setPayments(Array.isArray(data.items) ? data.items : []);
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setPayments([]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (autoFetch) fetchBoard();
  }, [autoFetch, fetchBoard]);

  return { payments, setPayments, isLoading, error, refetch: fetchBoard };
}

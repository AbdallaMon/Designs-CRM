"use client";

// List hook for a user's commissions. GET /v2/admin/commissions REQUIRES a `userId` (the BE
// scopes the list to one user), so the screen ALWAYS picks a user first; this hook only fetches
// once a userId is set. Calls the adminResidual SERVICE (never apiFetch). The response is the
// user's commission rows (array or { items }). Arabic / RTL.

import { useCallback, useEffect, useState } from "react";
import { adminResidualService } from "../adminResidual.service.js";

export function useCommissionsList({ userId } = {}) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCommissions = useCallback(async () => {
    if (!userId) {
      setItems([]);
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminResidualService.listCommissions({ userId });
      const data = res?.data ?? {};
      if (Array.isArray(data)) setItems(data);
      else if (Array.isArray(data.items)) setItems(data.items);
      else setItems([]);
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setItems([]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  return { items, isLoading, error, refetch: fetchCommissions };
}

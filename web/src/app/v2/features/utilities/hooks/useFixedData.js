"use client";

// List + CRUD for the studio's fixed/lookup data. Lists via the utilities service
// (GET /v2/utilities/fixed-data); create/update/delete route through the utilities mutation
// runner (toast resolving the backend CODE → Arabic) and hit the admin-residual write
// endpoints (/v2/admin/fixed-data). Every successful write refetches the list. Mirrors
// features/siteUtility/hooks/useContractPaymentConditions.js.

import { useCallback, useEffect, useState } from "react";
import { utilitiesService } from "../utilities.service.js";
import { runUtilitiesMutation } from "../utilities.mutations.js";

// Read the list defensively: GET /fixed-data returns the bare array under res.data, but we
// also tolerate an { items } envelope so a backend shape change degrades gracefully.
function readList(res) {
  const data = res?.data ?? [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.items) ? data.items : [];
}

/**
 * @param {object}  [opts]
 * @param {boolean} [opts.enabled]  gate the initial fetch on the list permission (default true)
 */
export function useFixedData({ enabled = true } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await utilitiesService.listFixedData();
      setRows(readList(res));
    } catch (err) {
      setError(err?.message || "فشل تحميل البيانات الثابتة");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createFixedData = useCallback(
    async (payload) => {
      const res = await runUtilitiesMutation(
        () => utilitiesService.createFixedData(payload),
        { loading: "جاري إضافة البيانات الثابتة..." },
      );
      if (res) await fetchData();
      return res;
    },
    [fetchData],
  );

  const updateFixedData = useCallback(
    async (id, payload) => {
      const res = await runUtilitiesMutation(
        () => utilitiesService.updateFixedData(id, payload),
        { loading: "جاري تحديث البيانات الثابتة..." },
      );
      if (res) await fetchData();
      return res;
    },
    [fetchData],
  );

  const deleteFixedData = useCallback(
    async (id) => {
      const res = await runUtilitiesMutation(
        () => utilitiesService.deleteFixedData(id),
        { loading: "جاري حذف البيانات الثابتة..." },
      );
      if (res) await fetchData();
      return Boolean(res);
    },
    [fetchData],
  );

  return {
    rows,
    loading,
    error,
    refetch: fetchData,
    createFixedData,
    updateFixedData,
    deleteFixedData,
  };
}

export default useFixedData;

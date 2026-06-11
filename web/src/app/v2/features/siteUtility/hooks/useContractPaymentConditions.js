"use client";

import { useCallback, useEffect, useState } from "react";
import siteUtilityService from "../siteUtility.service.js";
import { runSiteUtilityMutation } from "../siteUtility.mutations.js";

/** Read the list envelope defensively. The target contract returns
 *  { items, total, page, pageSize } under res.data, but we also accept a bare array
 *  (legacy parity) so a backend shape difference degrades gracefully. */
function readListEnvelope(res) {
  const data = res?.data ?? {};
  const items = Array.isArray(data) ? data : (data.items ?? []);
  const total = Array.isArray(data) ? data.length : (data.total ?? items.length);
  return { items, total };
}

/**
 * List + CRUD for contract payment conditions. Lists via GET (the backend supports
 * page/pageSize; the legacy admin UI showed the full set, so we keep a simple non-paged
 * fetch by default and expose params if needed). Create/update/delete route through the
 * mutation runner (toast). All refetch after a successful write.
 */
export function useContractPaymentConditions({ params = {}, enabled = true } = {}) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await siteUtilityService.listContractPaymentConditions(params);
      const env = readListEnvelope(res);
      setRows(env.items);
      setTotal(env.total);
    } catch (err) {
      setError(err?.message || "فشل تحميل شروط الدفع");
    } finally {
      setLoading(false);
    }
    // params is a plain object; stringify to avoid identity churn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createCondition = useCallback(
    async (payload) => {
      const res = await runSiteUtilityMutation(
        () => siteUtilityService.createContractPaymentCondition(payload),
        { loading: "جاري إنشاء شرط الدفع..." },
      );
      if (res) await fetchData();
      return res;
    },
    [fetchData],
  );

  const updateCondition = useCallback(
    async (id, payload) => {
      const res = await runSiteUtilityMutation(
        () => siteUtilityService.updateContractPaymentCondition(id, payload),
        { loading: "جاري تحديث شرط الدفع..." },
      );
      if (res) await fetchData();
      return res;
    },
    [fetchData],
  );

  const deleteCondition = useCallback(
    async (id) => {
      const res = await runSiteUtilityMutation(
        () => siteUtilityService.deleteContractPaymentCondition(id),
        { loading: "جاري حذف شرط الدفع..." },
      );
      if (res) await fetchData();
      return Boolean(res);
    },
    [fetchData],
  );

  return {
    rows,
    total,
    loading,
    error,
    refetch: fetchData,
    createCondition,
    updateCondition,
    deleteCondition,
  };
}

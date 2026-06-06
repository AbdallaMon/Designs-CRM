"use client";

import { useCallback, useEffect, useState } from "react";
import siteUtilityService from "../siteUtility.service.js";
import { runSiteUtilityMutation } from "../siteUtility.mutations.js";

/**
 * Reads the singleton pdf-utility config (GET /pdf-utility) and exposes an upsert
 * (POST /pdf-utility). The backend returns the config object under res.data; we read it
 * defensively (object or null). Mirrors the legacy PdfUtility fetch/refetch behaviour.
 */
export function usePdfUtility({ enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await siteUtilityService.getPdfUtility();
      setData(res?.data ?? null);
    } catch (err) {
      setError(err?.message || "فشل تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Upsert a single field (or several) onto the singleton, then refetch for parity with
  // the legacy field-card save flow.
  const upsert = useCallback(
    async (payload) => {
      const res = await runSiteUtilityMutation(
        () => siteUtilityService.upsertPdfUtility(payload),
        { loading: "جاري تحديث الإعدادات..." },
      );
      if (res) await fetchData();
      return res;
    },
    [fetchData],
  );

  return { data, loading, error, refetch: fetchData, upsert };
}

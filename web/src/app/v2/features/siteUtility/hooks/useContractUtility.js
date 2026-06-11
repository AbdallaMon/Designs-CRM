"use client";

import { useCallback, useEffect, useState } from "react";
import siteUtilityService from "../siteUtility.service.js";
import { runSiteUtilityMutation } from "../siteUtility.mutations.js";

/**
 * Contract-utility editor data hook. Loads the aggregate /details payload (the
 * obligations singleton + stage/special/level clause lists + capabilities) and
 * exposes the obligations save + clause CRUD. Every write routes through the
 * mutation runner (toast resolves the backend CODE → Arabic) and refetches /details
 * so the four sections stay in sync.
 */
export function useContractUtility({ enabled = true } = {}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await siteUtilityService.getContractUtilityDetails();
      setDetails(res?.data ?? null);
    } catch (err) {
      setError(err?.data?.message || err?.message || "فشل تحميل إعدادات عقد التصميم");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Run a write, refetch on success, return the envelope (or null).
  const run = useCallback(
    async (fn, loadingText) => {
      const res = await runSiteUtilityMutation(fn, { loading: loadingText });
      if (res) await fetchDetails();
      return res;
    },
    [fetchDetails],
  );

  // ── Obligations ────────────────────────────────────────────────────────────
  const saveObligations = useCallback(
    (payload) =>
      run(
        () => siteUtilityService.saveContractObligations(payload),
        "جاري حفظ الالتزامات...",
      ),
    [run],
  );

  // ── Stage clauses ──────────────────────────────────────────────────────────
  const createStageClause = useCallback(
    (payload) =>
      run(() => siteUtilityService.createStageClause(payload), "جاري إنشاء البند..."),
    [run],
  );
  const updateStageClause = useCallback(
    (id, payload) =>
      run(
        () => siteUtilityService.updateStageClause(id, payload),
        "جاري تحديث البند...",
      ),
    [run],
  );
  const deleteStageClause = useCallback(
    async (id) =>
      Boolean(
        await run(() => siteUtilityService.deleteStageClause(id), "جاري حذف البند..."),
      ),
    [run],
  );

  // ── Special clauses ────────────────────────────────────────────────────────
  const createSpecialClause = useCallback(
    (payload) =>
      run(
        () => siteUtilityService.createSpecialClause(payload),
        "جاري إنشاء البند...",
      ),
    [run],
  );
  const updateSpecialClause = useCallback(
    (id, payload) =>
      run(
        () => siteUtilityService.updateSpecialClause(id, payload),
        "جاري تحديث البند...",
      ),
    [run],
  );
  const deleteSpecialClause = useCallback(
    async (id) =>
      Boolean(
        await run(
          () => siteUtilityService.deleteSpecialClause(id),
          "جاري حذف البند...",
        ),
      ),
    [run],
  );

  // ── Level clauses ──────────────────────────────────────────────────────────
  const createLevelClause = useCallback(
    (payload) =>
      run(() => siteUtilityService.createLevelClause(payload), "جاري إنشاء البند..."),
    [run],
  );
  const updateLevelClause = useCallback(
    (id, payload) =>
      run(
        () => siteUtilityService.updateLevelClause(id, payload),
        "جاري تحديث البند...",
      ),
    [run],
  );
  const deleteLevelClause = useCallback(
    async (id) =>
      Boolean(
        await run(() => siteUtilityService.deleteLevelClause(id), "جاري حذف البند..."),
      ),
    [run],
  );

  return {
    details,
    obligations: details?.utility ?? null,
    stageClauses: details?.stageClauses ?? [],
    specialClauses: details?.specialClauses ?? [],
    levelClauses: details?.levelClauses ?? [],
    capabilities: details?.capabilities ?? { canEdit: false },
    loading,
    error,
    refetch: fetchDetails,
    saveObligations,
    createStageClause,
    updateStageClause,
    deleteStageClause,
    createSpecialClause,
    updateSpecialClause,
    deleteSpecialClause,
    createLevelClause,
    updateLevelClause,
    deleteLevelClause,
  };
}

export default useContractUtility;

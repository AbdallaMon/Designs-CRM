"use client";

// Authed contract-detail hook. Fetches a single contract via the contracts service (→ GET
// /v2/contracts/:contractId; object scope enforced server-side via the leads checker). Returns
// the detail object (stages, paymentsNew, clientLead+client, drawings, specialItems, projects).

import { useCallback, useEffect, useState } from "react";
import contractsService from "../contracts.service.js";

export function useContractDetail(contractId, { autoFetch = true } = {}) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!contractId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await contractsService.getById(contractId);
      setContract(res?.data ?? null);
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setContract(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    if (autoFetch) fetchDetail();
  }, [autoFetch, fetchDetail]);

  return { contract, loading, error, refetch: fetchDetail };
}

"use client";

// Authed lead-scoped contract list hook. Fetches the contracts for a lead via the contracts
// service (→ GET /v2/contracts/client-lead/:leadId; object scope enforced server-side via the
// leads checker). The BE returns an ARRAY (each contract with stages + a derived `level`).

import { useCallback, useEffect, useState } from "react";
import contractsService from "../contracts.service.js";

export function useLeadContracts(leadId, { autoFetch = true } = {}) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchContracts = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await contractsService.listForLead(leadId);
      setContracts(Array.isArray(res?.data) ? res.data : []);
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setContracts([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (autoFetch) fetchContracts();
  }, [autoFetch, fetchContracts]);

  return { contracts, loading, error, refetch: fetchContracts };
}

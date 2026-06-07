"use client";

// PUBLIC e-sign session hook. Fetches the contract session + default contract-utility data
// from the token-based public surface (contractsService.getSession → /v2/client/contracts/
// session?token=). UNGATED — the token IS the auth (apiFetch.public, no session/refresh).
// Owns { session, contractUtility, status, loading } and exposes refetch. The BE returns the
// legacy nested shape `{ data: session, contractUtility }` (preserved 1:1).

import { useCallback, useEffect, useState } from "react";
import contractsService from "../contracts.service.js";

export function useContractSession(token) {
  const [session, setSession] = useState(null);
  const [contractUtility, setContractUtility] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await contractsService.getSession(token);
      // envelope: { data: { data: session, contractUtility } }
      const payload = res?.data ?? {};
      setSession(payload.data ?? null);
      setContractUtility(payload.contractUtility ?? null);
    } catch {
      setSession(null);
      setContractUtility(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // status drives the wizard step: LOADING → INITIAL → SIGNING → REGISTERED (or ERROR).
  const status = loading ? "LOADING" : session?.sessionStatus || "ERROR";

  return { session, contractUtility, status, loading, refetch: fetchSession };
}

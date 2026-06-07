"use client";

// Detail hook — loads one lead via the leads SERVICE (never apiFetch directly). The
// backend attaches per-record `capabilities.*` to the detail payload (§5c); the detail
// page gates every action button on `lead.capabilities.*` × `hasPermission(...)`.

import { useCallback, useEffect, useState } from "react";
import { leadsService } from "@/app/v2/features/leads/leads.service.js";

export function useLeadDetail(leadId, { autoFetch = true } = {}) {
  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLead = useCallback(async () => {
    if (!leadId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const res = await leadsService.getLead(leadId);
      setLead(res?.data ?? null);
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (autoFetch) fetchLead();
  }, [autoFetch, fetchLead]);

  return { lead, setLead, isLoading, error, refetch: fetchLead };
}

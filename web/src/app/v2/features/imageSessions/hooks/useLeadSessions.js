"use client";

// Authed lead-scoped image-session list hook (SURFACE 2). Fetches a lead's image sessions via
// the image-sessions service (→ GET /v2/image-session/:clientLeadId/sessions; object scope
// enforced server-side via the leads checker). Also loads the spaces pick-list (GET /ids?
// model=space) used by the "create session" flow. The BE returns the sessions ARRAY at res.data.

import { useCallback, useEffect, useState } from "react";
import imageSessionsService from "../imageSessions.service.js";
import { PICK_LIST_MODELS } from "../config/imageSessionsConstants.js";

export function useLeadSessions(clientLeadId, { autoFetch = true } = {}) {
  const [sessions, setSessions] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async () => {
    if (!clientLeadId) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await imageSessionsService.listSessions(clientLeadId);
      setSessions(Array.isArray(res?.data) ? res.data : []);
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setSessions([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [clientLeadId]);

  const fetchSpaces = useCallback(async () => {
    try {
      // §5c #3: model name is the real delegate `space`; the service normalizes + guards it.
      const res = await imageSessionsService.modelIds({
        model: PICK_LIST_MODELS.SPACE,
        where: JSON.stringify({ isArchived: false }),
      });
      setSpaces(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setSpaces([]);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchSessions();
      fetchSpaces();
    }
  }, [autoFetch, fetchSessions, fetchSpaces]);

  return { sessions, spaces, loading, error, refetch: fetchSessions, refetchSpaces: fetchSpaces };
}

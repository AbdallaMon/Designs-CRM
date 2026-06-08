"use client";

// PUBLIC client image-session hook (SURFACE 3). Resolves the session from the per-session
// token (query param) via the token-based public surface (apiFetch.public, _skipRefresh — a
// 401 never triggers a refresh/redirect; the client has NO login session). The token IS the
// auth; the session is derived FROM the token server-side. Returns the session + a derived
// `status` ("LOADING" until the first fetch resolves; then the session's sessionStatus, or
// "ERROR" on an invalid/missing token).

import { useCallback, useEffect, useState } from "react";
import imageSessionsService from "../imageSessions.service.js";

export function useClientSession(token) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("LOADING");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSession = useCallback(async () => {
    if (!token) {
      setStatus("ERROR");
      setError("IMAGE_SESSION_TOKEN_INVALID");
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await imageSessionsService.getSession(token);
      const data = res?.data ?? null;
      setSession(data);
      setStatus(data?.sessionStatus || "INITIAL");
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "IMAGE_SESSION_TOKEN_INVALID");
      setSession(null);
      setStatus("ERROR");
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { session, status, loading, error, refetch: fetchSession };
}

"use client";

// Owns the Google Calendar connection state for the authed calendar surface. Reads
// GET /v2/calendar/google/status (calendar.google.view). Exposes the connection flag +
// a refetch. Connect/disconnect are run via runCalendarMutation by the caller, which then
// calls refetch(). Tokens are NEVER read or stored here — only the boolean status.

import { useCallback, useEffect, useState } from "react";
import { calendarService } from "../calendar.service.js";

export function useGoogleStatus({ enabled = true } = {}) {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const res = await calendarService.getGoogleStatus();
      setStatus(res?.data ?? null);
    } catch {
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    status,
    isConnected: Boolean(status?.connected),
    isLoading,
    refetch,
  };
}

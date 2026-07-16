"use client";
import { useCallback, useMemo, useState } from "react";

// Display thresholds for the aging badge (days in current stage).
export const AGING_WARN_DAYS = 4;
export const AGING_CRITICAL_DAYS = 7;

export function agingSeverity(days) {
  if (days == null) return null;
  if (days >= AGING_CRITICAL_DAYS) return "error";
  if (days >= AGING_WARN_DAYS) return "warning";
  return "default";
}

const seenKey = (leadId) => `ws-card-seen:${leadId}`;

// v1 unseen-updates dot: per-device localStorage "last opened" timestamp compared
// against the card's latestActivityAt (see spec §2 — DB-backed cross-device is a
// possible later upgrade, deliberately not built now).
export function useUnseenActivity(leadId, latestActivityAt) {
  const [seenAt, setSeenAt] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(seenKey(leadId));
    } catch {
      return null;
    }
  });

  const hasUnseen = useMemo(() => {
    if (!latestActivityAt) return false;
    if (!seenAt) return true;
    return new Date(latestActivityAt) > new Date(seenAt);
  }, [latestActivityAt, seenAt]);

  const markSeen = useCallback(() => {
    const now = new Date().toISOString();
    try {
      window.localStorage.setItem(seenKey(leadId), now);
    } catch {}
    setSeenAt(now);
  }, [leadId]);

  return { hasUnseen, markSeen };
}

"use client";

// <AttemptTimer> — optional countdown for a timed test (test.timeLimit minutes from startedAt).
// Display-only + a soft auto-submit callback when it hits zero (the SERVER remains authoritative
// on time enforcement; this is a UX aid). Renders a live region so AT announce the remaining
// time. Arabic / RTL.

import { useEffect, useRef, useState } from "react";
import { Chip } from "@mui/material";
import { MdTimer } from "react-icons/md";

function fmt(totalSec) {
  const s = Math.max(0, totalSec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function AttemptTimer({ startedAt, timeLimitMin, onExpire }) {
  const deadline = startedAt && timeLimitMin
    ? new Date(startedAt).getTime() + Number(timeLimitMin) * 60_000
    : null;
  const [remaining, setRemaining] = useState(deadline ? Math.round((deadline - Date.now()) / 1000) : null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!deadline) return undefined;
    const id = setInterval(() => {
      const left = Math.round((deadline - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline, onExpire]);

  if (!deadline || remaining == null) return null;
  const low = remaining <= 60;

  return (
    <Chip
      icon={<MdTimer />}
      color={low ? "error" : "default"}
      label={`الوقت المتبقّي: ${fmt(remaining)}`}
      role="timer"
      aria-live="polite"
      sx={{ fontWeight: 600 }}
    />
  );
}

export default AttemptTimer;

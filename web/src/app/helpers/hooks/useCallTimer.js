import { useState, useEffect } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import duration from "dayjs/plugin/duration";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const NOW_WINDOW = 3 * MINUTE;
const SHOW_SECONDS_UNDER = 10 * MINUTE;

function formatDuration(ms, { showSeconds = false } = {}) {
  const absMs = Math.abs(ms);
  const diff = dayjs.duration(absMs);

  const months = Math.floor(diff.asMonths());
  const days = Math.floor(diff.asDays()) % 30;
  const hours = diff.hours();
  const minutes = diff.minutes();
  const seconds = diff.seconds();

  const parts = [];

  if (months > 0) {
    parts.push(`${months} month${months > 1 ? "s" : ""}`);
  }

  if (days > 0) {
    parts.push(`${days} day${days > 1 ? "s" : ""}`);
  }

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  if (showSeconds) {
    parts.push(`${seconds}s`);
  }

  return parts.length ? parts.join(" ") : "less than 1m";
}

export function useCallTimer(call, userTimezone = dayjs.tz.guess(), type) {
  const [timeLeft, setTimeLeft] = useState("");
  const [hoursLeft, setHoursLeft] = useState(null);
  const [status, setStatus] = useState("unknown");

  useEffect(() => {
    if (!call?.time) {
      setTimeLeft("Unknown time");
      setHoursLeft(null);
      setStatus("unknown");
      return;
    }

    const label = type === "MEETING" ? "Meeting" : "Call";

    const updateTime = () => {
      const now = dayjs().tz(userTimezone);
      const callTime = dayjs(call.time).tz(userTimezone);

      const diffMs = callTime.diff(now);
      const absDiffMs = Math.abs(diffMs);

      if (absDiffMs <= NOW_WINDOW) {
        setTimeLeft(`${label} is now`);
        setHoursLeft(0);
        setStatus("now");
        return;
      }

      if (diffMs < 0) {
        setTimeLeft(`${label} was ${formatDuration(diffMs)} ago`);
        setHoursLeft(null);
        setStatus("past");
        return;
      }

      const showSeconds = diffMs <= SHOW_SECONDS_UNDER;

      setTimeLeft(
        `${label} starts in ${formatDuration(diffMs, { showSeconds })}`,
      );

      setHoursLeft(Math.floor(diffMs / HOUR));
      setStatus("future");
    };

    updateTime();

    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, [call?.time, userTimezone, type]);

  return { timeLeft, hoursLeft, status };
}

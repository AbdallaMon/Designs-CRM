import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export function useCallTimer(call, userTimezone = dayjs.tz.guess(), type) {
  const [timeLeft, setTimeLeft] = useState("");
  const [hoursLeft, setHoursLeft] = useState(null);
  const [statusColor, setStatusColor] = useState("gray");

  useEffect(() => {
    if (!call?.time) return;

    const updateTime = () => {
      const now = dayjs().tz(userTimezone);
      const callTime = dayjs(call.time).tz(userTimezone);
      const diffMs = callTime.diff(now);
      const diffDays = callTime.diff(now, "day");
      const diffHours = callTime.diff(now, "hour");

      if (diffMs >= -5 * 60 * 1000 && diffHours < 24) {
        // Call is today or within next 24h
        const hours = Math.floor(
          (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        setTimeLeft(
          `${
            type === "MEETING" ? "Meeting" : "Call"
          } in ${hours}h ${minutes}m ${seconds}s`
        );
        setStatusColor("red"); // ✅ Always red if within 24h
        setHoursLeft(diffHours);
        return;
      }

      if (diffMs < -5 * 60 * 1000) {
        const passedDays = Math.abs(diffDays);
        setTimeLeft(
          `${type === "MEETING" ? "Meeting" : "Call"} was ${passedDays} day${
            passedDays !== 1 ? "s" : ""
          } ago`
        );
        setStatusColor("gray");
        setHoursLeft(null);
        return;
      }

      // Upcoming but more than a day
      setTimeLeft(
        `${type === "MEETING" ? "Meeting" : "Call"} in ${diffDays} day${
          diffDays !== 1 ? "s" : ""
        }`
      );

      if (diffDays > 3) {
        setStatusColor("blue");
      } else if (diffDays >= 1) {
        setStatusColor("orange");
      } else {
        setStatusColor("red"); // Shouldn't happen here, but safe fallback
      }

      setHoursLeft(diffHours);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, [call, userTimezone]);

  return { timeLeft, hoursLeft, statusColor };
}

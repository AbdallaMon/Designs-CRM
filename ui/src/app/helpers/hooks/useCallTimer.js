import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export function useCallTimer(call, userTimezone = dayjs.tz.guess(), type) {
  const [timeLeft, setTimeLeft] = useState("");
  const [hoursLeft, setHoursLeft] = useState(null);

  useEffect(() => {
    if (!call?.time) return;

    const updateTime = () => {
      const now = dayjs().tz(userTimezone);
      const callTime = dayjs(call.time).tz(userTimezone); // Convert call time to user timezone
      const diff = callTime.diff(now, "milliseconds");

      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (diff >= -fiveMinutes && diff <= fiveMinutes) {
        // Call is happening within the ±5-minute window
        setTimeLeft(`${type === "MEETING" ? "Meeting" : "Call"} is now`);
        setHoursLeft(0);
        return;
      }

      if (diff < -fiveMinutes) {
        // Call has passed the 5-minute window
        const passedHours = Math.floor(-diff / (1000 * 60 * 60));
        const passedMinutes = Math.floor(
          (-diff % (1000 * 60 * 60)) / (1000 * 60)
        );

        setTimeLeft(
          `${type === "MEETING" ? "Meeting" : "Call"} was ${
            passedHours > 0 ? `${passedHours}h ` : ""
          }${passedMinutes > 0 ? `${passedMinutes}m ` : ""}ago`
        );

        setHoursLeft(null); // Call is in the past
        return;
      }

      // Calculate time components for upcoming calls
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Update state
      setTimeLeft(
        `${type === "MEETING" ? "Meeting" : "Call"} in ${
          days > 0 ? `${days}d ` : ""
        }${hours > 0 ? `${hours}h ` : ""}${
          minutes > 0 ? `${minutes}m ` : ""
        }${seconds}s`
      );

      setHoursLeft(days * 24 + hours); // Total remaining hours
    };

    updateTime(); // Initial calculation
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, [call, userTimezone]);

  return { timeLeft, hoursLeft };
}

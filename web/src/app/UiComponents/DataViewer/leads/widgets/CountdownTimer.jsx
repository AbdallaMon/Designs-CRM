import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(duration);
dayjs.extend(relativeTime);

const CountdownTimer = ({ time }) => {
  const deliveryDate = dayjs(time);
  const [timeLeft, setTimeLeft] = useState(getDiff(deliveryDate));
  const [now, setNow] = useState(dayjs());

  function getDiff(toDate) {
    const diff = toDate.diff(dayjs());
    return diff > 0 ? dayjs.duration(diff) : null;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(dayjs());
      setTimeLeft(getDiff(deliveryDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [deliveryDate]);

  const daysDiff = deliveryDate.diff(now, "day");
  const hoursDiff = deliveryDate.diff(now, "hour");

  const isPassed = deliveryDate.isBefore(now, "second");
  const isToday = deliveryDate.isSame(now, "day");

  const formatDuration = (dur) => {
    if (!dur) return "";
    return `${dur.hours()}h ${dur.minutes()}m ${dur.seconds()}s`;
  };

  // ✅ Fixed Color Logic
  let bgColor = "#e3f2fd"; // default blue
  let color = "#1976d2";

  if (isPassed) {
    bgColor = "#eeeeee"; // light gray
    color = "#616161"; // gray
  } else if (isToday || hoursDiff < 24) {
    bgColor = "#ffe5e5";
    color = "#d32f2f"; // red
  } else if (daysDiff <= 3) {
    bgColor = "#fff3e0";
    color = "#f57c00"; // orange
  } else if (daysDiff > 14) {
    bgColor = "#e8f5e9";
    color = "#2e7d32"; // green
  }
  return (
    <div
      style={{
        padding: "4px 8px",
        backgroundColor: bgColor,
        color: color,
        fontWeight: 500,
        borderRadius: "4px",
        fontSize: "0.85rem",
      }}
    >
      {isPassed
        ? `Was ${deliveryDate.format("MMM D, YYYY")}`
        : daysDiff < 1
        ? formatDuration(timeLeft)
        : `${daysDiff} day${daysDiff !== 1 ? "s" : ""} left`}
    </div>
  );
};

export default CountdownTimer;

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

const CountdownTimer = ({ time }) => {
  const deliveryDate = dayjs(time);
  const [timeLeft, setTimeLeft] = useState(getDiff(deliveryDate));
  const isPassed = deliveryDate.isBefore(dayjs());

  function getDiff(toDate) {
    const diff = toDate.diff(dayjs());
    return diff > 0 ? dayjs.duration(diff) : null;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getDiff(deliveryDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [deliveryDate]);

  const formatDuration = (dur) => {
    if (!dur) return "";
    return `${dur.days()}d ${dur.hours()}h ${dur.minutes()}m ${dur.seconds()}s`;
  };

  return (
    <div
      style={{
        padding: "4px 8px",
        backgroundColor: isPassed ? "#ffe5e5" : "#e5f5ff",
        color: isPassed ? "red" : "#1976d2",
        fontWeight: 500,
        borderRadius: "4px",
        fontSize: "0.85rem",
      }}
    >
      {isPassed
        ? `Was ${deliveryDate.format("MMM D, YYYY")}`
        : formatDuration(timeLeft)}
    </div>
  );
};

export default CountdownTimer;

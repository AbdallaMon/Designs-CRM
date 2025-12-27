/**
 * Determine day group label for a message
 */
export function getDayGroup(msgDate, now) {
  // Reset time to midnight for comparison
  const msgDay = new Date(
    msgDate.getFullYear(),
    msgDate.getMonth(),
    msgDate.getDate()
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = today.getTime() - msgDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "today";
  } else if (diffDays === 1) {
    return "yesterday";
  } else if (diffDays < 7) {
    // Return day name for current week
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[msgDate.getDay()];
  } else {
    // Return formatted date for older messages
    return msgDate.toISOString().split("T")[0]; // YYYY-MM-DD
  }
}

/**
 * Friendly day label for UI
 */
export function getDayLabel(msgDate, now) {
  const msgDay = new Date(
    msgDate.getFullYear(),
    msgDate.getMonth(),
    msgDate.getDate()
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = today.getTime() - msgDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[msgDate.getDay()];
  }
  // e.g., Jan 5, 2025
  return msgDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getMonthGroup(date) {
  return date.getFullYear() * 100 + (date.getMonth() + 1);
}
export function getMonthGroupLabel(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

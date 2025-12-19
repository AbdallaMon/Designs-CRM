import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";

dayjs.extend(isToday);
dayjs.extend(isYesterday);

/**
 * Get day group label for a message date
 * Returns: "Today" | "Yesterday" | Day name (e.g., "Monday") | Full date
 */
export function getDayGroupLabel(date) {
  const messageDate = dayjs(date);
  const now = dayjs();

  if (messageDate.isToday()) {
    return "Today";
  }

  if (messageDate.isYesterday()) {
    return "Yesterday";
  }

  // Check if within current week (past 7 days)
  const daysDiff = now.diff(messageDate, "day");
  if (daysDiff >= 0 && daysDiff < 7) {
    return messageDate.format("dddd"); // Monday, Tuesday, etc.
  }

  // Older messages: full date
  return messageDate.format("MMMM D, YYYY");
}

/**
 * Check if a divider should be shown before this message
 * Compare with previous message's date
 */
export function shouldShowDayDivider(currentMsg, previousMsg) {
  if (!previousMsg) return true; // Always show for first message

  const currentDate = dayjs(currentMsg.createdAt).format("YYYY-MM-DD");
  const previousDate = dayjs(previousMsg.createdAt).format("YYYY-MM-DD");

  return currentDate !== previousDate;
}

/**
 * Process messages array to add day grouping metadata
 * Use this as fallback if backend doesn't provide dayGroup/showDayDivider
 */
export function processMessagesWithDayGroups(messages) {
  return messages.map((msg, index) => {
    const previousMsg = index > 0 ? messages[index - 1] : null;

    return {
      ...msg,
      dayGroup: msg.dayGroup || getDayGroupLabel(msg.createdAt),
      showDayDivider:
        msg.showDayDivider !== undefined
          ? msg.showDayDivider
          : shouldShowDayDivider(msg, previousMsg),
    };
  });
}

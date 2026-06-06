// ── Day grouping ─────────────────────────────────────────────────────────────

function getDayGroup(msgDate, now) {
  const msgDay = new Date(
    msgDate.getFullYear(),
    msgDate.getMonth(),
    msgDate.getDate(),
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((today - msgDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) {
    return [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][msgDate.getDay()];
  }
  return msgDate.toISOString().split("T")[0];
}

function getDayLabel(msgDate, now) {
  const msgDay = new Date(
    msgDate.getFullYear(),
    msgDate.getMonth(),
    msgDate.getDate(),
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((today - msgDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][msgDate.getDay()];
  }
  return msgDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Add day-grouping metadata to a list of chat messages (ascending order).
 */
export function addDayGrouping(messages, options = {}) {
  if (!messages || messages.length === 0) return [];

  const now = new Date();
  const { userId, clientId, unreadCount } = options;
  let previousDayGroup = null;
  let firstUnreadMarked = false;

  return messages.map((msg) => {
    const msgDate = new Date(msg.createdAt);
    const dayGroup = getDayGroup(msgDate, now);
    const dayLabel = getDayLabel(msgDate, now);
    const showDayDivider = dayGroup !== previousDayGroup;
    previousDayGroup = dayGroup;

    const isOtherSender =
      (userId !== null && msg.senderId !== userId) ||
      (clientId !== null && msg.senderClient !== clientId);

    const isUnreadForMember =
      isOtherSender && (!msg.readReceipts || msg.readReceipts.length === 0);

    const showUnreadCount = !firstUnreadMarked && isUnreadForMember;
    if (showUnreadCount) firstUnreadMarked = true;

    return {
      ...msg,
      dayGroup,
      dayLabel,
      showDayDivider,
      isPinned: !!msg.pinnedIn,
      ...(showUnreadCount ? { showUnreadCount: true, unreadCount } : {}),
    };
  });
}

// ── Month grouping ────────────────────────────────────────────────────────────

function getMonthGroup(date) {
  return date.getFullYear() * 100 + (date.getMonth() + 1);
}

function getMonthGroupLabel(date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Add month-grouping metadata to a list of chat attachment objects.
 * Mutates the `uniqueMonths` map (month -> count).
 */
export function addMonthGrouping(attachments, uniqueMonths = {}) {
  if (!attachments || attachments.length === 0) return [];

  let previousMonthGroup = null;
  const countedMonths = {};

  return attachments.map((attachment) => {
    const createdAt = attachment.message?.createdAt;
    const fileDate = createdAt ? new Date(createdAt) : new Date();
    const monthGroup = getMonthGroup(fileDate);
    const groupLabel = getMonthGroupLabel(fileDate);
    const showMonthDivider = monthGroup !== previousMonthGroup;
    const month = fileDate.toISOString().slice(0, 7); // YYYY-MM

    previousMonthGroup = monthGroup;

    if (!countedMonths[month]) {
      uniqueMonths[month] = (uniqueMonths[month] || 0) + 1;
      countedMonths[month] = true;
    }

    return {
      id: attachment.id,
      messageId: attachment.message?.id,
      roomId: attachment.message?.roomId,
      type: attachment.message?.type,
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileMimeType: attachment.fileMimeType,
      fileSize: attachment.fileSize,
      content: attachment.content,
      sender: attachment.message?.sender || attachment.message?.client || null,
      createdAt: attachment.message?.createdAt,
      month,
      monthGroup,
      groupLabel,
      showMonthDivider,
    };
  });
}

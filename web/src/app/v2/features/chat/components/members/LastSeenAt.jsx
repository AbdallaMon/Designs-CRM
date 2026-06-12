import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useT } from "@/app/v2/lib/i18n";

// Stable, language-neutral marker for the "online now" state. The display string is
// localized at render via t(); the online/offline decision must NOT depend on the
// translated text, so it is computed from the same minute threshold here.
const ONLINE_THRESHOLD_MINUTES = 4;

function isOnlineNow(lastSeenAt) {
  return dayjs().diff(dayjs(lastSeenAt), "minute") < ONLINE_THRESHOLD_MINUTES;
}

function formatLastSeen(lastSeenAt, t) {
  const now = dayjs();
  const lastSeen = dayjs(lastSeenAt);
  const diffInMinutes = now.diff(lastSeen, "minute");
  const diffInHours = now.diff(lastSeen, "hour");
  const diffInDays = now.diff(lastSeen, "day");
  if (diffInMinutes < ONLINE_THRESHOLD_MINUTES) return t("chat.lastSeen.online", "متصل الآن");
  if (diffInMinutes < 60)
    return t("chat.lastSeen.minutes", "آخر ظهور قبل {n} دقيقة").replace("{n}", diffInMinutes);
  if (diffInHours < 24)
    return t("chat.lastSeen.hours", "آخر ظهور قبل {n} ساعة").replace("{n}", diffInHours);
  if (diffInDays === 1)
    return t("chat.lastSeen.yesterday", "آخر ظهور أمس {time}").replace(
      "{time}",
      lastSeen.format("h:mm A"),
    );
  return t("chat.lastSeen.date", "آخر ظهور {date}").replace(
    "{date}",
    lastSeen.format("MMM D, YYYY [-] h:mm A"),
  );
}

export function LastSeenAt({ lastSeenAt }) {
  const { t } = useT();
  if (!lastSeenAt) return "";
  return (
    <Typography variant="caption" sx={{ display: "block", opacity: 0.7, fontSize: "0.75rem" }}>
      {formatLastSeen(lastSeenAt, t)}
    </Typography>
  );
}

export function OnlineStatus({ lastSeenAt }) {
  const { t } = useT();
  if (!lastSeenAt) return null;
  const isOnline = isOnlineNow(lastSeenAt);
  return (
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        backgroundColor: isOnline ? "lightgreen" : "lightcoral",
        display: "inline-block",
        position: "absolute",
        top: 0,
        insetInlineStart: 0,
        zIndex: 1,
      }}
      title={isOnline ? t("chat.lastSeen.onlineTitle", "متصل") : t("chat.lastSeen.offlineTitle", "غير متصل")}
    />
  );
}

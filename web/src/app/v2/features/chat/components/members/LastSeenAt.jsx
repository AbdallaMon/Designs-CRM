import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";

function formatLastSeen(lastSeenAt) {
  const now = dayjs();
  const lastSeen = dayjs(lastSeenAt);
  const diffInMinutes = now.diff(lastSeen, "minute");
  const diffInHours = now.diff(lastSeen, "hour");
  const diffInDays = now.diff(lastSeen, "day");
  if (diffInMinutes < 4) return "متصل الآن";
  if (diffInMinutes < 60) return `آخر ظهور قبل ${diffInMinutes} دقيقة`;
  if (diffInHours < 24) return `آخر ظهور قبل ${diffInHours} ساعة`;
  if (diffInDays === 1) return `آخر ظهور أمس ${lastSeen.format("h:mm A")}`;
  return `آخر ظهور ${lastSeen.format("MMM D, YYYY [-] h:mm A")}`;
}

export function LastSeenAt({ lastSeenAt }) {
  if (!lastSeenAt) return "";
  return (
    <Typography variant="caption" sx={{ display: "block", opacity: 0.7, fontSize: "0.75rem" }}>
      {formatLastSeen(lastSeenAt)}
    </Typography>
  );
}

export function OnlineStatus({ lastSeenAt }) {
  if (!lastSeenAt) return null;
  const isOnline = formatLastSeen(lastSeenAt) === "متصل الآن";
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
      title={isOnline ? "متصل" : "غير متصل"}
    />
  );
}

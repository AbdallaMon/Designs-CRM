import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
function formatLastSeen(lastSeenAt) {
  const now = dayjs();
  const lastSeen = dayjs(lastSeenAt);
  const diffInMinutes = now.diff(lastSeen, "minute");
  const diffInHours = now.diff(lastSeen, "hour");
  const diffInDays = now.diff(lastSeen, "day");
  if (diffInMinutes < 4) {
    return "Online";
  } else if (diffInMinutes < 60) {
    return `Last seen ${diffInMinutes} minute${
      diffInMinutes > 1 ? "s" : ""
    } ago`;
  } else if (diffInHours < 24) {
    return `Last seen ${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else if (diffInDays === 1) {
    return `Last seen yesterday at ${lastSeen.format("h:mm A")}`;
  } else {
    return `Last seen on ${lastSeen.format("MMM D, YYYY [at] h:mm A")}`;
  }
}
export function LastSeenAt({ lastSeenAt }) {
  if (!lastSeenAt) return "";
  const formattedLastSeen = formatLastSeen(lastSeenAt);

  return (
    <Typography
      variant="caption"
      sx={{ display: "block", opacity: 0.7, fontSize: "0.75rem" }}
    >
      {formattedLastSeen}
    </Typography>
  );
}
export function OnlineStatus({ lastSeenAt }) {
  if (!lastSeenAt) return null;
  const isOnline = formatLastSeen(lastSeenAt) === "Online";
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
        left: 0,
        zIndex: 1,
      }}
      title={isOnline ? "Online" : "Offline"}
      aria-label={isOnline ? "User is online" : "User is offline"}
    ></Box>
  );
}

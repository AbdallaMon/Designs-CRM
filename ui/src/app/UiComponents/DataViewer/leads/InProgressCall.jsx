import { useCallTimer } from "@/app/helpers/hooks/useCallTimer.js";
import { alpha, Box, Typography, useTheme } from "@mui/material";
import React from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/en";

dayjs.extend(utc);
dayjs.extend(timezone);

export function InProgressCall({ call, simple, type }) {
  const userTimezone = dayjs.tz.guess();
  const { timeLeft, statusColor } = useCallTimer(call, userTimezone, type);
  const theme = useTheme();

  const colorMap = {
    green: theme.palette.success.main,
    blue: theme.palette.info.main,
    orange: theme.palette.warning.main,
    red: theme.palette.error.main,
    gray: theme.palette.grey[700],
  };

  const bgMap = {
    green: alpha(theme.palette.success.main, 0.1),
    blue: alpha(theme.palette.info.main, 0.1),
    orange: alpha(theme.palette.warning.main, 0.1),
    red: alpha(theme.palette.error.main, 0.1),
    gray: alpha(theme.palette.grey[700], 0.1),
  };

  const callTimeFormatted = call?.time
    ? dayjs(call.time)
        .tz(userTimezone)
        .locale("en")
        .format("YYYY-MM-DD hh:mm A")
    : "Unknown Time";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "",
        height: 100,
        bgcolor: bgMap[statusColor],
        color: colorMap[statusColor],
        p: simple ? 1 : 2,
        borderRadius: 2,
        border: `1px solid ${alpha(colorMap[statusColor], 0.3)}`,
        mb: simple && 1,
        flexDirection: "column",
      }}
    >
      <Typography variant="subtitle2" fontWeight="600">
        {statusColor === "gray" ? "📌 Passed: " : "⏳ Scheduled: "} {timeLeft}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.8 }}>
        📅 {callTimeFormatted} ({userTimezone})
      </Typography>
    </Box>
  );
}

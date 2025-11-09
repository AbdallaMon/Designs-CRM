import { useCallTimer } from "@/app/helpers/hooks/useCallTimer.js";
import { alpha, Box, Typography, useTheme } from "@mui/material";
import React from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/en"; // Ensure English locale

dayjs.extend(utc);
dayjs.extend(timezone);

export function InProgressCall({ call, simple, type }) {
  const userTimezone = dayjs.tz.guess(); // Detect user's timezone
  const { timeLeft, hoursLeft } = useCallTimer(call, userTimezone, type);
  const theme = useTheme();

  const isUrgent = hoursLeft !== null && hoursLeft <= 12; // Mark as urgent if within 12 hours
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
        bgcolor: isUrgent
          ? alpha(theme.palette.error.main, 0.1)
          : alpha(theme.palette.primary.main, 0.05),
        color: isUrgent ? theme.palette.error.main : theme.palette.primary.main,
        p: simple ? 1 : 2,
        borderRadius: 2,
        border: `1px solid ${alpha(
          isUrgent ? theme.palette.error.main : theme.palette.primary.main,
          0.1
        )}`,
        mb: simple && 1,
        flexDirection: "column", // Stack timeLeft & actual time
      }}
    >
      <Typography variant="subtitle2" fontWeight="600">
        {isUrgent ? "⚠️ Urgent: " : "⏳ Scheduled: "}
        {timeLeft}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.8 }}>
        📅 {callTimeFormatted} ({userTimezone})
      </Typography>
    </Box>
  );
}

import { useCallTimer } from "@/app/helpers/hooks/useCallTimer.js";
import { alpha, Box, Chip, Stack, Typography, useTheme } from "@mui/material";
import React from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/en";

dayjs.extend(utc);
dayjs.extend(timezone);

export function InProgressCall({ call, simple, type }) {
  const userTimezone = dayjs.tz.guess();

  const { timeLeft, hoursLeft, status } = useCallTimer(
    call,
    userTimezone,
    type,
  );

  const theme = useTheme();

  const isUrgent = status === "future" && hoursLeft !== null && hoursLeft <= 12;

  const paletteKey =
    status === "now"
      ? "success"
      : isUrgent
        ? "error"
        : status === "past"
          ? "warning"
          : status === "future"
            ? "primary"
            : "text";

  const mainColor =
    paletteKey === "text"
      ? theme.palette.text.secondary
      : theme.palette[paletteKey].main;

  const bgColor =
    paletteKey === "text"
      ? alpha(theme.palette.text.secondary, 0.06)
      : alpha(mainColor, status === "now" ? 0.14 : 0.08);

  const borderColor =
    paletteKey === "text"
      ? alpha(theme.palette.text.secondary, 0.14)
      : alpha(mainColor, status === "now" ? 0.35 : 0.18);

  const icon =
    status === "now"
      ? "🟢"
      : isUrgent
        ? "⚠️"
        : status === "past"
          ? "🕘"
          : status === "future"
            ? "⏳"
            : "ℹ️";

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
        minHeight: 100,
        bgcolor: bgColor,
        color: mainColor,
        p: simple ? 1 : 2,
        borderRadius: 2,
        border: `1px solid ${borderColor}`,
        mb: simple && 1,
        flexDirection: "column",
        justifyContent: "center",
        gap: 0.75,
      }}
    >
      <Typography variant="subtitle2" fontWeight={700}>
        {icon} {timeLeft}
      </Typography>

      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          flexWrap: "wrap",
          rowGap: 0.75,
        }}
      >
        <Typography variant="body2" sx={{ opacity: 0.85 }}>
          📅 {callTimeFormatted} ({userTimezone})
        </Typography>
      </Stack>
    </Box>
  );
}

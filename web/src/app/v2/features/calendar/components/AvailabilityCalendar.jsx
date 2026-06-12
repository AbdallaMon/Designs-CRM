"use client";

// Month-grid availability calendar. Behavior + appearance PRESERVED from the legacy
// UiComponents/DataViewer/meeting/calendar/Calendar.jsx `Calendar` component — only the data
// access is repointed through calendarService (authed → /v2/calendar/*, public client →
// /v2/client/calendar/* via the token). NOT a redesign.
//
// Modes:
//  • isAdmin (authed): admin/staff selecting days to manage availability (adminId optional —
//    when set, manages another admin's availability for the staff "admin booking" tab).
//  • client (token): a prospective client picking an available day (public, ungated).

import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  IconButton,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  lighten,
} from "@mui/material";
import { MdArrowBack as ArrowBack, MdArrowForward as ArrowForward } from "react-icons/md";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import weekday from "dayjs/plugin/weekday";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

import LoadingOverlay from "@/app/v2/shared/components/feedback/LoadingOverlay";
import { calendarService } from "../calendar.service.js";
import { DEFAULT_TIMEZONE } from "../config/calendarConstants.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekday);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale("en");

export function AvailabilityCalendar({
  selectedDate,
  onDateSelect,
  multiSelect = false,
  selectedDates = [],
  timezone: userTimezone = DEFAULT_TIMEZONE,
  isAdmin,
  token,
  setError,
  rerender,
  setSessionData,
  setActiveStep,
  adminId,
  type,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [displayMonth, setDisplayMonth] = useState(() => dayjs().tz(userTimezone));
  const [monthData, setMonthData] = useState({ month: "", weeks: [] });
  const [loading, setLoading] = useState(true);

  const fetchMonth = async () => {
    try {
      setLoading(true);
      const monthParam = displayMonth.tz(userTimezone).format("YYYY-MM-DD");

      // If client with token, validate token / get session once here.
      if (token) {
        try {
          const tokenData = await calendarService.getMeetingData({
            token,
            timezone: userTimezone,
          });
          const data = tokenData?.data;
          if (!data) {
            setError?.(
              "Invalid or expired token please ask the customer support to resend the link",
            );
            return;
          }
          if (!data.selectedTimezone && data.userTimezone) {
            data.selectedTimezone = data.userTimezone;
          }
          setSessionData?.((old) => ({
            ...old,
            ...data,
            selectedTimezone: old.selectedTimezone || data.userTimezone,
          }));
          if (data.time) {
            setActiveStep?.(3);
          }
        } catch {
          setError?.(
            "Invalid or expired token please ask the customer support to resend the link",
          );
          return;
        }
      }

      let res;
      if (token) {
        res = await calendarService.getClientAvailableDays({
          token,
          month: monthParam,
          timezone: userTimezone,
        });
      } else {
        // authed surface: STAFF manages another admin's availability (adminId set); ADMIN
        // manages own. type is forwarded so the service/BE applies the right projection.
        res = await calendarService.getAvailableDays({
          month: monthParam,
          adminId: type === "STAFF" ? adminId : undefined,
          timezone: userTimezone,
          type,
        });
      }
      setMonthData(res?.data || { month: "", weeks: [] });
    } catch {
      setMonthData({ month: "", weeks: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMonth, rerender, adminId, userTimezone]);

  const navigateMonth = (direction) => {
    setDisplayMonth((prev) => prev.add(direction, "month"));
  };

  const monthYear = displayMonth.tz(userTimezone).format("MMMM YYYY");
  const weekDays = isMobile
    ? ["S", "M", "T", "W", "T", "F", "S"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleDayClick = (cell) => {
    const { isPast, isCurrentMonth, hasAvailableSlots, availableDay } = cell;
    if (isPast) return;
    if (!isCurrentMonth && !multiSelect) return;

    const dayJs = dayjs.tz(cell.isoDate, userTimezone);

    if (multiSelect) {
      const alreadySelected = selectedDates.some((d) => dayjs(d).isSame(dayJs, "day"));
      if (!alreadySelected && !isAdmin && !hasAvailableSlots) return;
      if (alreadySelected) {
        const newSelected = selectedDates.filter((d) => !dayjs(d).isSame(dayJs, "day"));
        onDateSelect(newSelected, availableDay || null);
      } else {
        onDateSelect([...selectedDates, dayJs], availableDay || null);
      }
    } else {
      onDateSelect(dayJs, availableDay || null);
    }
  };

  const isCellSelected = (cell) => {
    const dayJs = dayjs.tz(cell.isoDate, userTimezone);
    if (multiSelect) {
      return selectedDates.some((d) => dayjs(d).isSame(dayJs, "day"));
    }
    if (selectedDate && !isAdmin) {
      return dayjs(selectedDate).isSame(dayJs, "day");
    }
    return false;
  };

  return (
    <Paper
      elevation={0}
      sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <IconButton
          onClick={() => navigateMonth(-1)}
          size={isMobile ? "small" : "medium"}
          sx={{ bgcolor: "background.paper", boxShadow: 1, "&:hover": { boxShadow: 2 } }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant={isMobile ? "h6" : "h5"} fontWeight="600">
          {monthYear}
        </Typography>
        <IconButton
          onClick={() => navigateMonth(1)}
          size={isMobile ? "small" : "medium"}
          sx={{ bgcolor: "background.paper", boxShadow: 1, "&:hover": { boxShadow: 2 } }}
        >
          <ArrowForward />
        </IconButton>
      </Box>

      {/* Weekday headers + month grid */}
      <Grid container spacing={0} sx={{ position: "relative" }}>
        {loading && <LoadingOverlay isLoading />}

        {weekDays.map((dayLabel, i) => (
          <Grid key={`${dayLabel}-${i}`} size={{ xs: 12 / 7 }}>
            <Box textAlign="center" py={1}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">
                {dayLabel}
              </Typography>
            </Box>
          </Grid>
        ))}

        {monthData.weeks.map((week, wIndex) =>
          week.map((cell, index) => {
            const selected = isCellSelected(cell);
            const { isCurrentMonth, isPast, hasAvailableSlots, fullyBooked } = cell;

            const canClick =
              !isPast &&
              (isCurrentMonth || multiSelect) &&
              (isAdmin || (!isAdmin && hasAvailableSlots)) &&
              ((isAdmin && ((multiSelect && !hasAvailableSlots) || !multiSelect)) || !isAdmin);

            return (
              <Grid key={`${wIndex}-${index}`} size={{ xs: 12 / 7 }}>
                <Box
                  onClick={() => canClick && handleDayClick(cell)}
                  sx={{
                    height: isMobile ? 40 : 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: canClick ? "pointer" : "not-allowed",
                    borderRadius: 2,
                    m: 0.5,
                    backgroundColor: fullyBooked
                      ? lighten(theme.palette.error.main, 0.85)
                      : selected
                        ? "primary.main"
                        : hasAvailableSlots && !isPast
                          ? lighten(theme.palette.success.main, 0.85)
                          : "background.paper",
                    color: selected
                      ? "primary.contrastText"
                      : !isCurrentMonth || isPast
                        ? "text.disabled"
                        : "text.primary",
                    border: "1px solid",
                    borderColor: fullyBooked
                      ? "error.main"
                      : !canClick
                        ? "transparent"
                        : selected
                          ? "primary.main"
                          : hasAvailableSlots
                            ? "success.main"
                            : "transparent",
                    "&:hover": canClick
                      ? { bgcolor: selected ? "primary.dark" : "primary.50", transform: "scale(1.05)", boxShadow: 2 }
                      : {},
                    transition: "all 0.2s ease",
                    opacity:
                      (!canClick && type === "CLIENT") ||
                      !isCurrentMonth ||
                      (isPast && type === "CLIENT")
                        ? 0.4
                        : 1,
                  }}
                >
                  <Typography
                    variant={isMobile ? "caption" : "body2"}
                    fontWeight={selected ? 600 : 400}
                    sx={{
                      color:
                        !isCurrentMonth || isPast
                          ? "text.disabled"
                          : (!canClick && type === "CLIENT") || fullyBooked
                            ? "red"
                            : selected
                              ? "primary.contrastText"
                              : "text.primary",
                    }}
                  >
                    {cell.label}
                  </Typography>
                </Box>
              </Grid>
            );
          }),
        )}
      </Grid>

      {/* Legend */}
      <Box mt={3} pb={2}>
        <Grid container spacing={2} sx={{ px: 2 }} alignItems="center">
          <Grid>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                width={12}
                height={12}
                bgcolor={theme.palette.success.main}
                borderRadius={1}
                border="1px solid"
                borderColor="success.main"
              />
              <Typography variant="caption" fontWeight="500">
                متاح
              </Typography>
            </Box>
          </Grid>
          <Grid>
            <Box display="flex" alignItems="center" gap={1}>
              <Box width={12} height={12} bgcolor="error.main" borderRadius={1} />
              <Typography variant="caption" fontWeight="500">
                غير متاح
              </Typography>
            </Box>
          </Grid>
          <Grid>
            <Box display="flex" alignItems="center" gap={1}>
              <Box width={12} height={12} bgcolor="primary.main" borderRadius={1} />
              <Typography variant="caption" fontWeight="500">
                محدد
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}

export default AvailabilityCalendar;

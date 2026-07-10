"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Switch,
  FormControlLabel,
  AppBar,
  Toolbar,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
  lighten,
} from "@mui/material";
import {
  MdSchedule as Schedule,
  MdAdd as Add,
  MdDelete as DeleteIcon,
  MdArrowBack as ArrowBack,
  MdArrowForward as ArrowForward,
  MdClose as Close,
} from "react-icons/md";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import weekday from "dayjs/plugin/weekday";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { buildMonthGrid } from "@/app/UiComponents/DataViewer/meeting/calendar/calendarHelpers.js";
import TimeSlotManager from "@/app/UiComponents/DataViewer/meeting/calendar/TimeSlotManager.jsx";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekday);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale("en");

// =================== CALENDAR ===================

export const Calendar = ({
  selectedDate,
  onDateSelect,
  multiSelect = false,
  selectedDates = [],
  timezone: userTimezone = "Asia/Dubai",
  isAdmin,
  token,
  setError,
  rerender,
  setSessionData,
  setActiveStep,
  adminId,
  type,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [displayMonth, setDisplayMonth] = useState(() =>
    dayjs().tz(userTimezone)
  );
  const [monthData, setMonthData] = useState({ month: "", weeks: [] });
  const [loading, setLoading] = useState(true);
  const fetchMonth = async () => {
    try {
      setLoading(true);

      const monthParam = displayMonth.tz(userTimezone).format("YYYY-MM-DD");

      // If client with token, validate token / get session once here
      if (token) {
        const tokenData = await getData({
          url: `client/calendar/meeting-data?token=${token}&timezone=${userTimezone}&`,
          setLoading,
        });

        if (!tokenData || tokenData.status !== 200) {
          setError(
            "Invalid or expired token please ask the customer support to resend the link"
          );
          return;
        } else {
          if (!tokenData.data.selectedTimezone && tokenData.data.userTimezone) {
            tokenData.data.selectedTimezone = tokenData.data.userTimezone;
          }
          setSessionData?.((old) => ({
            ...old,
            ...tokenData.data,
            selectedTimezone:
              old.selectedTimezone || tokenData.data.userTimezone,
          }));
          if (tokenData.data.time) {
            setActiveStep?.(3);
          }
        }
      }

      const baseUrl =
        type === "STAFF"
          ? `shared/calendar/available-days?month=${monthParam}&adminId=${adminId}&`
          : isAdmin
          ? `shared/calendar/available-days?month=${monthParam}&`
          : `client/calendar/available-days?month=${monthParam}&token=${token}&`;

      const url =
        baseUrl + `&timezone=${userTimezone}&isMobile=${isMobile ? 1 : 0}&`;

      const dataReq = await getData({
        url,
        setLoading,
      });

      if (dataReq.status === 200) {
        // The backend returns a FLAT array of available days; build the
        // { month, weeks: [[cell,...7], ...] } grid the renderer expects.
        // (If a backend ever returns a pre-built grid, it's passed through.)
        setMonthData(buildMonthGrid(dataReq.data, displayMonth, userTimezone));
      } else {
        setMonthData({ month: "", weeks: [] });
      }
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

  // ---- Click / selection logic (only) ----

  const handleDayClick = (cell) => {
    const { isPast, isCurrentMonth, hasAvailableSlots, availableDay } = cell;

    if (isPast) return;
    if (!isCurrentMonth && !multiSelect) return;

    const dayJs = dayjs.tz(cell.isoDate, userTimezone);

    if (multiSelect) {
      const alreadySelected = selectedDates.some((d) =>
        dayjs(d).isSame(dayJs, "day")
      );

      if (!alreadySelected && !isAdmin && !hasAvailableSlots) return;

      if (alreadySelected) {
        const newSelected = selectedDates.filter(
          (d) => !dayjs(d).isSame(dayJs, "day")
        );
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
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
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
            sx={{
              bgcolor: "background.paper",
              boxShadow: 1,
              "&:hover": { boxShadow: 2 },
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="600">
            {monthYear}
          </Typography>
          <IconButton
            onClick={() => navigateMonth(1)}
            size={isMobile ? "small" : "medium"}
            sx={{
              bgcolor: "background.paper",
              boxShadow: 1,
              "&:hover": { boxShadow: 2 },
            }}
          >
            <ArrowForward />
          </IconButton>
        </Box>

        {/* Weekday headers + month grid */}
        <Grid container spacing={0} sx={{ position: "relative" }}>
          {loading && <LoadingOverlay />}

          {weekDays.map((dayLabel) => (
            <Grid key={dayLabel} size={{ xs: 12 / 7 }}>
              <Box textAlign="center" py={1}>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color="text.secondary"
                >
                  {dayLabel}
                </Typography>
              </Box>
            </Grid>
          ))}

          {(monthData?.weeks || []).map((week, wIndex) =>
            week.map((cell, index) => {
              const selected = isCellSelected(cell);
              const { isCurrentMonth, isPast, hasAvailableSlots, fullyBooked } =
                cell;

              const canClick =
                !isPast &&
                (isCurrentMonth || multiSelect) &&
                (isAdmin || (!isAdmin && hasAvailableSlots)) &&
                ((isAdmin &&
                  ((multiSelect && !hasAvailableSlots) || !multiSelect)) ||
                  !isAdmin);

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
                        ? {
                            bgcolor: selected ? "primary.dark" : "primary.50",
                            transform: "scale(1.05)",
                            boxShadow: 2,
                          }
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
            })
          )}
        </Grid>

        {/* Legend */}
        <Box mt={3}>
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
                  Available
                </Typography>
              </Box>
            </Grid>
            <Grid>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  width={12}
                  height={12}
                  bgcolor="error.main"
                  borderRadius={1}
                />
                <Typography variant="caption" fontWeight="500">
                  Un available
                </Typography>
              </Box>
            </Grid>
            <Grid>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  width={12}
                  height={12}
                  bgcolor="primary.main"
                  borderRadius={1}
                />
                <Typography variant="caption" fontWeight="500">
                  Selected
                </Typography>
              </Box>
            </Grid>
            {multiSelect && (
              <Grid>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    width={16}
                    height={16}
                    bgcolor="text.disabled"
                    borderRadius={1}
                    sx={{ opacity: 0.5 }}
                  />
                  <Typography variant="caption" fontWeight="500">
                    Unavailable
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

// =================== ADMIN BOOKING PANEL ===================

export const AdminBookingPanel = ({
  timezone: tz = Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "Asia/Dubai",
  adminId,
  type = "ADMIN",
}) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [openSlotManager, setOpenSlotManager] = useState(false);
  const [dayId, setDayId] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [rerender, setRerender] = useState(false);

  const handleDateSelect = (date, d) => {
    if (multiSelectMode) {
      setSelectedDates(Array.isArray(date) ? date : [date]);
    } else {
      setSelectedDate(date);
      setOpenSlotManager(true);
      setDayId(d ? d.id : null);
    }
  };

  const handleMultiSelectConfirm = () => {
    if (selectedDates.length > 0) {
      setOpenSlotManager(true);
      setDayId(null);
    }
  };

  const clearSelection = () => {
    setSelectedDates([]);
    setSelectedDate(null);
    setOpenSlotManager(false);
    setDayId(null);
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexDirection={isMobile ? "column" : "row"}
        gap={2}
      >
        <Typography variant="h4" gutterBottom fontWeight="700">
          Admin Dashboard
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={multiSelectMode}
              onChange={(e) => {
                setMultiSelectMode(e.target.checked);
                clearSelection();
              }}
            />
          }
          label="Multi-Select Mode"
        />
      </Box>

      <Grid container spacing={3}>
        <Grid>
          <Calendar
            selectedDate={selectedDate}
            selectedDates={selectedDates}
            onDateSelect={handleDateSelect}
            multiSelect={multiSelectMode}
            timezone={tz}
            isAdmin={true}
            rerender={rerender}
            adminId={adminId}
            type={type}
          />

          {multiSelectMode && selectedDates.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="600">
                Selected Dates ({selectedDates.length})
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                {selectedDates.map((date, index) => (
                  <Chip
                    key={index}
                    label={dayjs(date).format("MMM D")}
                    onDelete={() => {
                      setSelectedDates(
                        selectedDates.filter(
                          (d) => !dayjs(d).isSame(date, "day")
                        )
                      );
                    }}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleMultiSelectConfirm}
                  disabled={selectedDates.length === 0}
                  fullWidth={isMobile}
                  sx={{ borderRadius: 2 }}
                >
                  Configure Selected Dates
                </Button>
                <Button
                  variant="outlined"
                  onClick={clearSelection}
                  sx={{ borderRadius: 2 }}
                >
                  Clear Selection
                </Button>
              </Stack>
            </Paper>
          )}
        </Grid>
      </Grid>

      <TimeSlotManager
        open={openSlotManager}
        onClose={() => setOpenSlotManager(false)}
        date={selectedDate}
        selectedDates={selectedDates}
        isMultiDate={multiSelectMode}
        timezone={tz}
        dayId={dayId}
        setRerender={setRerender}
        type={type}
        adminId={adminId}
        setDayId={setDayId}
        selectedDate={selectedDate}
      />
    </Box>
  );
};

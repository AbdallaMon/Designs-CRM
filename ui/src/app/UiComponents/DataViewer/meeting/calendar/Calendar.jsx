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
        // Expected shape:
        // {
        //   month: "2025-11",
        //   weeks: [
        //     [ { isoDate, label, isCurrentMonth, isPast, hasAvailableSlots, fullyBooked, availableDay }, ... 7 ],
        //     ...
        //   ]
        // }
        setMonthData(dataReq.data || { month: "", weeks: [] });
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

          {monthData.weeks.map((week, wIndex) =>
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

// =================== TIME SLOT MANAGER ===================

const TimeSlotManager = ({
  open,
  onClose,
  date,
  timezone: tz = "Asia/Dubai",
  isMultiDate = false,
  selectedDates = [],
  dayId,
  setRerender,
  type,
  adminId,
  onUpdate,
  setDayId,
  selectedDate,
}) => {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slots, setSlots] = useState([]);
  const [meetingDuration, setMeetingDuration] = useState(60);
  const [breakDuration, setBreakDuration] = useState(15);
  const [customSlotDialog, setCustomSlotDialog] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { setAlertError } = useAlertContext();
  const { setLoading: setToastLoading } = useToastContext();
  const [loading, setLoading] = useState(false);

  const generateSlots = async () => {
    if (!startTime || !endTime || !meetingDuration || !breakDuration) {
      setAlertError("Please fill all fields before generating slots.");
      return;
    }
    if (type === "STAFF") {
      setAlertError("Staff cannot generate slots. Please contact an admin.");
      return;
    }

    const dateStr = date ? dayjs(date).format("YYYY-MM-DD") : null;
    const daysStr = selectedDates.map((d) => dayjs(d).format("YYYY-MM-DD"));

    const data = {
      date: dateStr,
      days: daysStr,
      fromHour: startTime,
      toHour: endTime,
      duration: meetingDuration,
      breakMinutes: breakDuration,
    };

    let url;
    if (isMultiDate) {
      url = `shared/calendar-management/available-days/multiple?timezone=${tz}&isMobile=${
        isMobile ? 1 : 0
      }&`;
    } else {
      url = `shared/calendar-management/available-days?timezone=${tz}&isMobile=${
        isMobile ? 1 : 0
      }&`;
    }

    const slotReq = await handleRequestSubmit(
      data,
      setToastLoading,
      url,
      false,
      "Updating slots...",
      false,
      "POST"
    );

    if (slotReq.status === 200) {
      if (isMultiDate) {
        window.location.reload();
      }
      await getSlotsData();

      if (onUpdate) {
        await onUpdate();
      }
    }
  };

  const deleteSlot = async (slotId) => {
    if (type === "STAFF") {
      setAlertError("Staff cannot delete slots. Please contact an admin.");
      return;
    }
    const deleteReq = await handleRequestSubmit(
      { id: slotId },
      setToastLoading,
      `shared/calendar-management/slots/${slotId}`,
      false,
      "Deleting slot...",
      false,
      "DELETE"
    );
    if (deleteReq.status === 200) {
      await getSlotsData();
      if (onUpdate) {
        await onUpdate();
      }
    }
  };

  const addCustomSlot = async () => {
    if (customStart && customEnd) {
      const data = {
        dayId: dayId,
        startTime: customStart,
        endTime: customEnd,
      };
      const slotReq = await handleRequestSubmit(
        data,
        setToastLoading,
        `shared/calendar-management/add-custom/${dayId}?timezone=${tz}&isMobile=${
          isMobile ? 1 : 0
        }&`,
        false,
        "Adding custom slot..."
      );
      if (slotReq.status === 200) {
        await getSlotsData();
        if (onUpdate) {
          await onUpdate();
        }

        setCustomSlotDialog(false);
        setCustomStart("");
        setCustomEnd("");
      }
    }
  };

  const getSlotsData = async () => {
    if (!selectedDate) {
      return;
    }
    const dateParam = dayjs(selectedDate).format("YYYY-MM-DD");
    console.log(tz, "tz");
    const slotsReq = await getData({
      url: `shared/calendar-management/slots?date=${dateParam}&adminId=${adminId}&timezone=${tz}&`,
      setLoading,
    });
    console.log(slotsReq, "slotsReq");
    if (slotsReq.status === 200) {
      setSlots(slotsReq.data);
      if (slotsReq.data.length > 0) {
        setDayId(slotsReq.data[0].availableDayId);
      }
      setRerender((prev) => !prev);
    } else {
      setSlots([]);
      setAlertError("Failed to fetch slots. Please try again.");
    }
  };

  const deleteDay = async () => {
    if (type === "STAFF") {
      setAlertError("Staff cannot delete slots. Please contact an admin.");
      return;
    }
    const deleteReq = await handleRequestSubmit(
      { id: dayId },
      setToastLoading,
      `shared/calendar-management/days/${dayId}`,
      false,
      "Deleting Day...",
      false,
      "DELETE"
    );

    if (deleteReq.status === 200) {
      await getSlotsData();
      setDayId(null);
      if (onUpdate) {
        await onUpdate();
      }
    }
  };

  useEffect(() => {
    if (!isMultiDate && selectedDate) {
      getSlotsData();
    }
  }, [isMultiDate, selectedDates, selectedDate]);

  const groupedSlots = isMultiDate
    ? []
    : slots.reduce((acc, slot) => {
        const dateKey = slot.date || dayjs(slot.startTime).format("YYYY-MM-DD");
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(slot);
        return acc;
      }, {});

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 3 },
        }}
      >
        {loading && <FullScreenLoader />}
        {isMobile && (
          <AppBar position="static" elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={onClose}>
                <Close />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Configure Time Slots
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        {!isMobile && (
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h5" fontWeight="600">
              Configure Time Slots
            </Typography>
            {isMultiDate && (
              <Typography variant="body2" color="text.secondary">
                {selectedDates.length} dates selected
              </Typography>
            )}
          </DialogTitle>
        )}

        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          {type !== "STAFF" && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Slot Generation Settings
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    label="Start Time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    label="End Time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    label="Duration (min)"
                    type="number"
                    value={meetingDuration}
                    onChange={(e) => setMeetingDuration(Number(e.target.value))}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    label="Break (min)"
                    type="number"
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(Number(e.target.value))}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Stack direction="row" spacing={2} mt={2}>
                {type !== "STAFF" && (
                  <Button
                    variant="contained"
                    onClick={generateSlots}
                    startIcon={<Schedule />}
                    sx={{ borderRadius: 2 }}
                  >
                    Generate Slots
                  </Button>
                )}
                {!isMultiDate && dayId && type !== "STAFF" && (
                  <Button
                    variant="outlined"
                    onClick={() => setCustomSlotDialog(true)}
                    startIcon={<Add />}
                    sx={{ borderRadius: 2 }}
                  >
                    Add Custom
                  </Button>
                )}
              </Stack>
            </Box>
          )}

          <Box>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Generated Slots ({slots.length})
            </Typography>

            {groupedSlots &&
              !isMultiDate &&
              !loading &&
              Object.entries(groupedSlots).map(([dateKey, dateSlots]) => (
                <Paper
                  key={dateKey}
                  elevation={0}
                  sx={{
                    mb: 2,
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                    {dayjs(dateKey).format("dddd, MMMM D, YYYY")}
                  </Typography>
                  <Grid container spacing={1}>
                    {dateSlots.map((slot) => (
                      <Grid size={{ sm: 6, md: 4 }} key={slot.id}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Box>
                                <Typography variant="body2" fontWeight="500">
                                  {dayjs(slot.startTime)
                                    .tz(tz)
                                    .format("h:mm A")}{" "}
                                  -{" "}
                                  {dayjs(slot.endTime).tz(tz).format("h:mm A")}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={slot.isBooked ? "Booked" : "Available"}
                                  color={slot.isBooked ? "error" : "success"}
                                  variant="outlined"
                                  sx={{
                                    mt: 1,
                                    bgcolor: slot.isBooked
                                      ? lighten(theme.palette.error.main, 0.2)
                                      : lighten(
                                          theme.palette.success.main,
                                          0.2
                                        ),
                                  }}
                                />
                              </Box>
                              {type !== "STAFF" && (
                                <IconButton
                                  onClick={() => deleteSlot(slot.id)}
                                  disabled={slot.isBooked}
                                  size="small"
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          {dayId && type !== "STAFF" && (
            <Button
              startIcon={<DeleteIcon />}
              color="error"
              onClick={deleteDay}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Delete
            </Button>
          )}
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Slot Dialog */}
      <Dialog
        open={customSlotDialog}
        onClose={() => setCustomSlotDialog(false)}
      >
        <DialogTitle>Add Custom Time Slot</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              fullWidth
              label="Start Time"
              type="time"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="End Time"
              type="time"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomSlotDialog(false)}>Cancel</Button>
          <Button onClick={addCustomSlot} variant="contained">
            Add Slot
          </Button>
        </DialogActions>
      </Dialog>
    </>
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

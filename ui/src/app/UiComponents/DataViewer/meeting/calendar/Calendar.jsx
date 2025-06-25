"use client";
import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Grid2 as Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Fab,
  Slide,
  AppBar,
  Toolbar,
  Badge,
  Alert,
  Stack,
  useTheme,
  useMediaQuery,
  alpha,
  lighten,
} from "@mui/material";
import {
  MdCalendarToday as CalendarToday,
  MdAccessTime as AccessTime,
  MdDelete as Delete,
  MdAdd as Add,
  MdPerson as Person,
  MdAdminPanelSettings as AdminPanelSettings,
  MdSchedule as Schedule,
  MdCheckCircle as CheckCircle,
  MdArrowBack as ArrowBack,
  MdArrowForward as ArrowForward,
  MdClose as Close,
  MdLocationOn as LocationOn,
  MdVideoCall as VideoCall,
  MdPhone as Phone,
} from "react-icons/md";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { getData } from "@/app/helpers/functions/getData";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export const Calendar = ({
  selectedDate,
  onDateSelect,
  multiSelect = false,
  selectedDates = [],
  timezone: userTimezone = "Asia/Dubai", // User's current timezone
  isAdmin,
  token,
  setError,
  rerender,
  setSessionData,
  setActiveStep,
  adminId,
  type,
}) => {
  const [displayMonth, setDisplayMonth] = useState(dayjs());
  const [bookedDays, setBookedDays] = useState([]);
  const [availableDays, setAvailableDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  async function getAvailableDays() {
    if (token) {
      const tokenData = await getData({
        url: `client/calendar/meeting-data?token=${token}&`,
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
        setSessionData((old) => ({
          ...old,
          ...tokenData.data,
        }));
        if (tokenData.data.time) {
          setActiveStep(4);
        }
      }
    }
    const dataReq = await getData({
      url:
        type === "STAFF"
          ? `shared/calendar/available-days?month=${displayMonth}&adminId=${adminId}&`
          : isAdmin
          ? `shared/calendar/available-days?month=${displayMonth}&`
          : `client/calendar/available-days?month=${displayMonth}&token=${token}&`,
      setLoading,
    });
    if (dataReq.status === 200) {
      setAvailableDays(dataReq.data);
      setBookedDays(dataReq.data.filter((day) => day.fullyBooked));
    }
  }

  useEffect(() => {
    getAvailableDays();
  }, [displayMonth, rerender, adminId]);

  const getDaysInMonth = () => {
    const startOfMonth = displayMonth.startOf("month");
    const endOfMonth = displayMonth.endOf("month");
    const startDate = startOfMonth.startOf("week");
    const endDate = endOfMonth.endOf("week");

    const days = [];
    let current = startDate;

    while (current.isBefore(endDate) || current.isSame(endDate, "day")) {
      days.push(current);
      current = current.add(1, "day");
    }

    return days;
  };

  // Helper function to convert GMT stored date to user's timezone and get the date string
  const getDateInUserTimezone = (gmtDate) => {
    return dayjs.utc(gmtDate).tz(userTimezone).format("YYYY-MM-DD");
  };

  // Helper function to check if a date is past in user's timezone
  const isPastInUserTimezone = (dayToCheck) => {
    const todayInUserTz = dayjs().tz(userTimezone).startOf("day");
    const dayInUserTz = dayjs(dayToCheck).tz(userTimezone).startOf("day");
    return dayInUserTz.isBefore(todayInUserTz);
  };

  const getDayStatus = (day, index) => {
    const dayStrInUserTz = day.format("YYYY-MM-DD");

    // Find available day by converting stored GMT dates to user timezone
    const availableDay = availableDays.find((d) => {
      const availableDateInUserTz = getDateInUserTimezone(d.date);

      return availableDateInUserTz === dayStrInUserTz;
    });

    const hasAvailableSlots = !!availableDay;

    // Check if fully booked using the same timezone conversion
    const isFullyBooked = bookedDays.some((d) => {
      const bookedDateInUserTz = getDateInUserTimezone(d.date);

      return bookedDateInUserTz === dayStrInUserTz && d.fullyBooked;
    });

    const isSelected = multiSelect
      ? selectedDates.some((d) => dayjs(d).isSame(day, "day"))
      : selectedDate && !isAdmin && dayjs(selectedDate).isSame(day, "day");

    // Check if date is past using user's timezone
    const isPastDate = isPastInUserTimezone(day);

    return {
      hasAvailableSlots,
      isFullyBooked,
      isSelected,
      isPastDate,
      isCurrentMonth: day.month() === displayMonth.month(),
      availableDay,
    };
  };

  const handleDateClick = (day, availableDay) => {
    const status = getDayStatus(day);
    if (status.isPastDate) return;

    if (!status.isCurrentMonth && !multiSelect) return;

    if (multiSelect) {
      const isAlreadySelected = selectedDates.some((d) =>
        dayjs(d).isSame(day, "day")
      );

      if (status.hasAvailableSlots && !isAlreadySelected) {
        return;
      }

      if (isAlreadySelected) {
        const newSelectedDates = selectedDates.filter(
          (d) => !dayjs(d).isSame(day, "day")
        );
        onDateSelect(newSelectedDates, availableDay);
      } else {
        onDateSelect([...selectedDates, day], availableDay);
      }
    } else {
      onDateSelect(day, availableDay);
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = displayMonth.add(direction, "month");
    setDisplayMonth(newMonth);
  };

  const days = getDaysInMonth();
  const weekDays = isMobile
    ? ["S", "M", "T", "W", "T", "F", "S"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthYear = displayMonth.format("MMMM YYYY");

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
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

      <Grid container spacing={0} sx={{ position: "relative" }}>
        {loading && <LoadingOverlay />}
        {weekDays.map((day) => (
          <Grid key={day} size={{ xs: 12 / 7 }}>
            <Box textAlign="center" py={1}>
              <Typography
                variant="caption"
                fontWeight="bold"
                color="text.secondary"
              >
                {day}
              </Typography>
            </Box>
          </Grid>
        ))}

        {days.map((day, index) => {
          const status = getDayStatus(day, index);
          const currentMonth = status.isCurrentMonth;
          const selected = status.isSelected;
          const available = status.hasAvailableSlots;
          const past = status.isPastDate;
          const canClick =
            !past &&
            (currentMonth || multiSelect) &&
            (isAdmin || (!isAdmin && available)) &&
            ((isAdmin && ((multiSelect && !available) || !multiSelect)) ||
              !isAdmin);
          const availableDay = status.availableDay;

          return (
            <Grid key={index} size={{ xs: 12 / 7 }}>
              <Box
                onClick={() => canClick && handleDateClick(day, availableDay)}
                sx={{
                  height: isMobile ? 40 : 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: canClick ? "pointer" : "not-allowed",
                  borderRadius: 2,
                  m: 0.5,
                  bgcolor: selected
                    ? "primary.main"
                    : available
                    ? "success.50"
                    : "background.paper",
                  color: selected
                    ? "primary.contrastText"
                    : !currentMonth || past
                    ? "text.disabled"
                    : "text.primary",
                  border: "1px solid",
                  borderColor: selected
                    ? "primary.main"
                    : available
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
                  opacity: !currentMonth || past ? 0.4 : 1,
                }}
              >
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  fontWeight={selected ? 600 : 400}
                >
                  {day.date()}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>

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
                bgcolor="warning.light"
                borderRadius={1}
              />
              <Typography variant="caption" fontWeight="500">
                Booked
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
  );
};

// Enhanced Time Slot Manager Component with Dialog
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

    const data = {
      date: date,
      days: selectedDates,
      fromHour: startTime,
      toHour: endTime,
      duration: meetingDuration,
      breakMinutes: breakDuration,
      dayId: dayId,
    };
    const url = `admin/calendar/available-days/${
      dayId ? dayId : isMultiDate ? "multiple" : ""
    }`;
    const slotReq = await handleRequestSubmit(
      data,
      setToastLoading,
      url + `?timezone=${tz}`,
      false,
      "Updating slots...",
      false,
      dayId ? "PUT" : "POST"
    );

    if (slotReq.status === 200) {
      if (isMultiDate) {
        window.location.reload();
      }
      await getSlotsData();
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
      `admin/calendar/slots/${slotId}`,
      false,
      "Deleting slot...",
      false,
      "DELETE"
    );
    if (deleteReq.status === 200) {
      await getSlotsData();
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
        `admin/calendar/add-custom/${dayId}?timezone=${tz}`,
        false,
        "Adding custom slot..."
      );
      if (slotReq.status === 200) {
        await getSlotsData();
        setCustomSlotDialog(false);
        setCustomStart("");
        setCustomEnd("");
      }
    }
  };

  const getSlotsData = async () => {
    if (!date) {
      return;
    }
    const userTimezone = dayjs.tz.guess();
    const submittedUtcDate = dayjs.utc(date);
    const offsetInMinutes = dayjs().tz(userTimezone).utcOffset(); // e.g. 180
    const correctedDate = submittedUtcDate.add(offsetInMinutes, "minute");
    const slotsReq = await getData({
      url: `shared/calendar/slots?date=${correctedDate}&adminId=${adminId}&timezone=${tz}&`,
      setLoading,
    });
    if (slotsReq.status === 200) {
      setSlots(slotsReq.data);
      setRerender((prev) => !prev);
    } else {
      setSlots([]);
      setAlertError("Failed to fetch slots. Please try again.");
    }
  };
  useEffect(() => {
    if (!isMultiDate) {
      getSlotsData();
    }
  }, [isMultiDate, selectedDates, date]);
  const groupedSlots = isMultiDate
    ? []
    : slots.reduce((acc, slot) => {
        const date = slot.date || dayjs(slot.startTime).format("YYYY-MM-DD");
        if (!acc[date]) acc[date] = [];
        acc[date].push(slot);
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
              Object.entries(groupedSlots).map(([date, dateSlots]) => (
                <Paper
                  key={date}
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
                    {dayjs(date).format("dddd, MMMM D, YYYY")}
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
                                  <Delete />
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
      />
    </Box>
  );
};

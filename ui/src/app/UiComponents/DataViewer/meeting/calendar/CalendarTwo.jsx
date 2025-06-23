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
  Grid,
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
import ClientBooking from "./ClientBooking";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// Enhanced Calendar Component
export const Calendar = ({
  selectedDate,
  onDateSelect,
  availableDays = [],
  bookedDays = [],
  currentMonth,
  onMonthChange,
  multiSelect = false,
  selectedDates = [],
  timezone: tz = "Asia/Dubai",
}) => {
  const [displayMonth, setDisplayMonth] = useState(currentMonth || dayjs());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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

  const getDayStatus = (day) => {
    const dayStr = day.format("YYYY-MM-DD");
    const hasAvailableSlots = availableDays.some((d) => d.date === dayStr);
    const isFullyBooked = bookedDays.some(
      (d) => d.date === dayStr && d.fullyBooked
    );
    const isSelected = multiSelect
      ? selectedDates.some((d) => dayjs(d).isSame(day, "day"))
      : selectedDate && dayjs(selectedDate).isSame(day, "day");

    const today = dayjs().tz(tz);
    const isPastDate = day.isBefore(today, "day");

    return {
      hasAvailableSlots,
      isFullyBooked,
      isSelected,
      isPastDate,
      isCurrentMonth: day.month() === displayMonth.month(),
    };
  };

  const handleDateClick = (day) => {
    const status = getDayStatus(day);

    // Prevent clicking on past dates
    if (status.isPastDate) return;

    // Prevent clicking on non-current month days in single select mode
    if (!status.isCurrentMonth && !multiSelect) return;

    if (multiSelect) {
      const isAlreadySelected = selectedDates.some((d) =>
        dayjs(d).isSame(day, "day")
      );

      // In multi-select mode, prevent selecting days that already have available slots
      // unless they're already selected (to allow deselection)
      if (status.hasAvailableSlots && !isAlreadySelected) {
        return; // Don't allow selecting days that already have available slots
      }

      if (isAlreadySelected) {
        // Remove from selection
        const newSelectedDates = selectedDates.filter(
          (d) => !dayjs(d).isSame(day, "day")
        );
        onDateSelect(newSelectedDates);
      } else {
        // Add to selection
        onDateSelect([...selectedDates, day]);
      }
    } else {
      onDateSelect(day);
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = displayMonth.add(direction, "month");
    setDisplayMonth(newMonth);
    onMonthChange?.(newMonth);
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
        p: isMobile ? 2 : 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
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

      <Grid container spacing={0}>
        {weekDays.map((day) => (
          <Grid key={day} item xs={12 / 7}>
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
          const status = getDayStatus(day);
          const canClick =
            !status.isPastDate &&
            (status.isCurrentMonth || multiSelect) &&
            (!multiSelect || !status.hasAvailableSlots || status.isSelected);

          return (
            <Grid key={index} item xs={12 / 7}>
              <Box
                onClick={() => canClick && handleDateClick(day)}
                sx={{
                  height: isMobile ? 40 : 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: canClick ? "pointer" : "not-allowed",
                  borderRadius: 2,
                  m: 0.5,
                  bgcolor: status.isSelected
                    ? "primary.main"
                    : status.hasAvailableSlots
                    ? "success.light"
                    : status.isFullyBooked
                    ? "warning.light"
                    : "background.paper",
                  color: status.isSelected
                    ? "primary.contrastText"
                    : !status.isCurrentMonth
                    ? "text.disabled"
                    : status.isPastDate
                    ? "text.disabled"
                    : multiSelect &&
                      status.hasAvailableSlots &&
                      !status.isSelected
                    ? "text.disabled"
                    : "text.primary",
                  "&:hover": canClick
                    ? {
                        bgcolor: status.isSelected
                          ? "primary.dark"
                          : "action.hover",
                        transform: "scale(1.05)",
                        boxShadow: 2,
                      }
                    : {},
                  transition: "all 0.2s ease",
                  boxShadow: status.isSelected ? 2 : 0,
                  border: status.hasAvailableSlots ? "2px solid" : "1px solid",
                  borderColor: status.hasAvailableSlots
                    ? "success.main"
                    : "transparent",
                  opacity: !canClick && multiSelect ? 0.5 : 1,
                }}
              >
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  fontWeight={status.isSelected ? "bold" : "normal"}
                >
                  {day.date()}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      <Box mt={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                width={16}
                height={16}
                bgcolor="success.light"
                borderRadius={1}
                border="2px solid"
                borderColor="success.main"
              />
              <Typography variant="caption" fontWeight="500">
                Available
              </Typography>
            </Box>
          </Grid>
          <Grid item>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                width={16}
                height={16}
                bgcolor="warning.light"
                borderRadius={1}
              />
              <Typography variant="caption" fontWeight="500">
                Booked
              </Typography>
            </Box>
          </Grid>
          <Grid item>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                width={16}
                height={16}
                bgcolor="primary.main"
                borderRadius={1}
              />
              <Typography variant="caption" fontWeight="500">
                Selected
              </Typography>
            </Box>
          </Grid>
          {multiSelect && (
            <Grid item>
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
  existingSlots = [],
  onSlotsChange,
  timezone: tz = "Asia/Dubai",
  isMultiDate = false,
  selectedDates = [],
}) => {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [meetingDuration, setMeetingDuration] = useState(60);
  const [breakDuration, setBreakDuration] = useState(15);
  const [slots, setSlots] = useState(existingSlots);
  const [customSlotDialog, setCustomSlotDialog] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    setSlots(existingSlots);
  }, [existingSlots]);

  const generateSlots = () => {
    const targetDates = isMultiDate ? selectedDates : [date];
    const allSlots = [];

    targetDates.forEach((targetDate) => {
      const newSlots = [];
      const dateStr = dayjs(targetDate).format("YYYY-MM-DD");
      const start = dayjs(`${dateStr}T${startTime}:00`).tz(tz);
      const end = dayjs(`${dateStr}T${endTime}:00`).tz(tz);

      let current = start;
      while (current.add(meetingDuration, "minute").isSameOrBefore(end)) {
        const slotEnd = current.add(meetingDuration, "minute");
        newSlots.push({
          id: `temp-${Date.now()}-${newSlots.length}`,
          startTime: current.toISOString(),
          endTime: slotEnd.toISOString(),
          isBooked: false,
          date: dateStr,
        });
        current = slotEnd.add(breakDuration, "minute");
      }
      allSlots.push(...newSlots);
    });

    setSlots(allSlots);
    onSlotsChange(allSlots);
  };

  const deleteSlot = (slotId) => {
    const updatedSlots = slots.filter((slot) => slot.id !== slotId);
    setSlots(updatedSlots);
    onSlotsChange(updatedSlots);
  };

  const addCustomSlot = () => {
    if (customStart && customEnd) {
      const targetDates = isMultiDate ? selectedDates : [date];
      const newSlots = [];

      targetDates.forEach((targetDate) => {
        const dateStr = dayjs(targetDate).format("YYYY-MM-DD");
        const startDateTime = dayjs(`${dateStr}T${customStart}:00`).tz(tz);
        const endDateTime = dayjs(`${dateStr}T${customEnd}:00`).tz(tz);

        const newSlot = {
          id: `custom-${Date.now()}-${Math.random()}`,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          isBooked: false,
          date: dateStr,
        };

        newSlots.push(newSlot);
      });

      const updatedSlots = [...slots, ...newSlots].sort(
        (a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
      );

      setSlots(updatedSlots);
      onSlotsChange(updatedSlots);
      setCustomSlotDialog(false);
      setCustomStart("");
      setCustomEnd("");
    }
  };

  const groupedSlots = slots.reduce((acc, slot) => {
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
          <Box mb={3}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Slot Generation Settings
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
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
              <Grid item xs={6} sm={3}>
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
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Duration (min)"
                  type="number"
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(Number(e.target.value))}
                  size="small"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
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
              <Button
                variant="contained"
                onClick={generateSlots}
                startIcon={<Schedule />}
                sx={{ borderRadius: 2 }}
              >
                Generate Slots
              </Button>
              <Button
                variant="outlined"
                onClick={() => setCustomSlotDialog(true)}
                startIcon={<Add />}
                sx={{ borderRadius: 2 }}
              >
                Add Custom
              </Button>
            </Stack>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Generated Slots ({slots.length})
            </Typography>

            {Object.entries(groupedSlots).map(([date, dateSlots]) => (
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
                    <Grid item xs={12} sm={6} md={4} key={slot.id}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Box>
                              <Typography variant="body2" fontWeight="500">
                                {dayjs(slot.startTime).tz(tz).format("h:mm A")}{" "}
                                - {dayjs(slot.endTime).tz(tz).format("h:mm A")}
                              </Typography>
                              <Chip
                                size="small"
                                label={slot.isBooked ? "Booked" : "Available"}
                                color={slot.isBooked ? "error" : "success"}
                                variant="outlined"
                                sx={{ mt: 1 }}
                              />
                            </Box>
                            <IconButton
                              onClick={() => deleteSlot(slot.id)}
                              disabled={slot.isBooked}
                              size="small"
                              color="error"
                            >
                              <Delete />
                            </IconButton>
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
          <Button
            variant="contained"
            onClick={() => {
              onClose();
              // Here you would typically save to your backend
              console.log("Saving slots:", slots);
            }}
            sx={{ borderRadius: 2 }}
          >
            Save Availability
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

// Enhanced Admin Panel Component
const AdminPanel = ({ timezone: tz = "Asia/Dubai" }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [availableDays, setAvailableDays] = useState([]);
  const [openSlotManager, setOpenSlotManager] = useState(false);
  const [currentSlots, setCurrentSlots] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const mockAvailableDays = [
    { date: dayjs().format("YYYY-MM-DD"), slots: 5, bookedSlots: 2 },
    {
      date: dayjs().add(1, "day").format("YYYY-MM-DD"),
      slots: 8,
      bookedSlots: 8,
    },
    {
      date: dayjs().add(3, "day").format("YYYY-MM-DD"),
      slots: 6,
      bookedSlots: 1,
    },
  ];

  const bookedDays = mockAvailableDays
    .filter((day) => day.slots === day.bookedSlots)
    .map((day) => ({ date: day.date, fullyBooked: true }));

  const handleDateSelect = (date) => {
    if (multiSelectMode) {
      setSelectedDates(Array.isArray(date) ? date : [date]);
    } else {
      setSelectedDate(date);
      setOpenSlotManager(true);
      setCurrentSlots([]);
    }
  };

  const handleMultiSelectConfirm = () => {
    if (selectedDates.length > 0) {
      setOpenSlotManager(true);
      setCurrentSlots([]);
    }
  };

  const handleSlotsChange = (slots) => {
    setCurrentSlots(slots);
  };

  const clearSelection = () => {
    setSelectedDates([]);
    setSelectedDate(null);
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
        <Grid item xs={12} lg={8}>
          <Calendar
            selectedDate={selectedDate}
            selectedDates={selectedDates}
            onDateSelect={handleDateSelect}
            availableDays={mockAvailableDays}
            bookedDays={bookedDays}
            multiSelect={multiSelectMode}
            timezone={tz}
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

        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <Card
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  <Schedule sx={{ mr: 1, verticalAlign: "middle" }} />
                  Quick Stats
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography
                      variant="h4"
                      fontWeight="700"
                      color="primary.main"
                    >
                      {mockAvailableDays.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Days with availability
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="h4"
                      fontWeight="700"
                      color="warning.main"
                    >
                      {bookedDays.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fully booked days
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="h4"
                      fontWeight="700"
                      color="success.main"
                    >
                      {mockAvailableDays.reduce(
                        (acc, day) => acc + (day.slots - day.bookedSlots),
                        0
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available slots
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <TimeSlotManager
        open={openSlotManager}
        onClose={() => setOpenSlotManager(false)}
        date={selectedDate}
        selectedDates={selectedDates}
        isMultiDate={multiSelectMode}
        existingSlots={currentSlots}
        onSlotsChange={handleSlotsChange}
        timezone={tz}
      />
    </Box>
  );
};
// Main App Component
const CalendarBookingSystem = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [userTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Paper elevation={0} sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
        >
          <Tab
            icon={<AdminPanelSettings />}
            label="Admin Panel"
            iconPosition="start"
          />
          <Tab icon={<Person />} label="Client Booking" iconPosition="start" />
        </Tabs>
      </Paper>

      <Box>
        {currentTab === 0 && <AdminPanel timezone={userTimezone} />}
        {currentTab === 1 && <ClientBooking timezone={userTimezone} />}
      </Box>
    </Container>
  );
};

export default CalendarBookingSystem;

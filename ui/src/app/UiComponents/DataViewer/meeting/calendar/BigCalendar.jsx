"use client";
import React, { useState, useEffect } from "react";
import {
  Paper,
  Box,
  Grid2 as Grid,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Badge,
  useTheme,
  useMediaQuery,
  Skeleton,
  CircularProgress,
  FormControlLabel,
  Switch,
  Card,
  CardHeader,
  Stack,
  CardContent,
  CardActions,
} from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  MdArrowBack,
  MdArrowForward,
  MdCalendarToday,
  MdClose,
  MdEvent,
  MdInfo,
  MdPhone,
  MdToday,
} from "react-icons/md";
import { CallCard, MeetingCard } from "../../leads/extra/CallAndMeetingCard";
import { getData } from "@/app/helpers/functions/getData";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay";

dayjs.extend(utc);
dayjs.extend(timezone);

const DayDetailDialog = ({ open, onClose, selectedDay, isAdmin }) => {
  const [dayData, setDayData] = useState();
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const { user } = useAuth();
  async function getDataForADay() {
    const userTimezone = dayjs.tz.guess();
    const submittedUtcDate = dayjs.utc(selectedDay);
    const offsetInMinutes = dayjs().tz(userTimezone).utcOffset(); // e.g. 180
    const correctedDate = submittedUtcDate.add(offsetInMinutes, "minute");
    const req = await getData({
      url: `shared/calendar/dates/day?date=${correctedDate}&isAdmin=${isAdmin}&`,
      setLoading,
    });

    if (req.status === 200) {
      console.log(req.data, "day data");
      setDayData(req.data);
    }
  }
  useEffect(() => {
    if (selectedDay && open) {
      getDataForADay();
    }
  }, [selectedDay]);
  const onUpdate = async () => {
    return await getDataForADay();
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {selectedDay?.format("MMMM DD, YYYY")}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <MdClose />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ position: "relative" }}>
        {loading && <LoadingOverlay />}
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          sx={{ mb: 2 }}
        >
          <Tab
            label={
              <Badge badgeContent={dayData?.meetings?.length} color="primary">
                <Box display="flex" alignItems="center" gap={1}>
                  <MdEvent fontSize="small" />
                  Meetings
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={dayData?.calls?.length} color="secondary">
                <Box display="flex" alignItems="center" gap={1}>
                  <MdPhone fontSize="small" />
                  Calls
                </Box>
              </Badge>
            }
          />
        </Tabs>

        <Box sx={{ maxHeight: 500, overflow: "auto" }}>
          {tabValue === 0 && (
            <Box>
              {dayData?.meetings?.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No meetings scheduled for this day
                </Typography>
              ) : (
                dayData?.meetings?.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    extra={true}
                    onUpdate={onUpdate}
                  />
                ))
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              {dayData?.calls?.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No calls scheduled for this day
                </Typography>
              ) : (
                dayData?.calls?.map((call) => (
                  <CallCard
                    key={call.id}
                    call={call}
                    extra={true}
                    onUpdate={onUpdate}
                  />
                ))
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default function BigCalendar({
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
}) {
  const [displayMonth, setDisplayMonth] = useState(dayjs().tz(timezone));
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState("left");
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);

      const req = await getData({
        url: `shared/calendar/dates/month?year=${displayMonth.year()}&month=${
          displayMonth.month() + 1
        }&isAdmin=${isAdmin}&`,
        setLoading,
      });

      if (req.status === 200) {
        setCalendarData(req.data);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      setCalendarData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [displayMonth, user, timezone, isAdmin]);

  const handleSwitchChange = (event) => {
    setIsAdmin(event.target.checked);
  };

  const getDaysInMonth = () => {
    const startOfMonth = displayMonth.startOf("month");
    const endOfMonth = displayMonth.endOf("month");

    // Get the day of week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = startOfMonth.day();

    // Calculate how many days to go back to get to the start of the week
    // This ensures we always start on Sunday regardless of locale
    const daysToGoBack = firstDayOfWeek;
    const startDate = startOfMonth.subtract(daysToGoBack, "day");

    // Get the day of week for the last day of the month
    const lastDayOfWeek = endOfMonth.day();

    // Calculate how many days to go forward to get to the end of the week
    // This ensures we always end on Saturday
    const daysToGoForward = 6 - lastDayOfWeek;
    const endDate = endOfMonth.add(daysToGoForward, "day");

    const days = [];
    let current = startDate;

    while (current.isBefore(endDate) || current.isSame(endDate, "day")) {
      days.push(current);
      current = current.add(1, "day");
    }

    return days;
  };

  const getDayData = (day) => {
    const dayKey = day.format("YYYY-MM-DD");
    const dayData = calendarData[dayKey] || { meetings: [], calls: [] };

    const dayMeetings = dayData.meetings.filter((meeting) => {
      const meetingDate = dayjs(meeting.time).tz(timezone);
      return meetingDate.format("YYYY-MM-DD") === dayKey;
    });

    const dayCalls = dayData.calls.filter((call) => {
      const callDate = dayjs(call.time).tz(timezone);
      return callDate.format("YYYY-MM-DD") === dayKey;
    });

    return {
      meetings: dayMeetings,
      calls: dayCalls,
      totalActivities: dayMeetings.length + dayCalls.length,
      isCurrentMonth: day.month() === displayMonth.month(),
      isToday: day.isSame(dayjs().tz(timezone), "day"),
      isPast: day.isBefore(dayjs().tz(timezone), "day"),
      isFuture: day.isAfter(dayjs().tz(timezone), "day"),
    };
  };

  const handleDayClick = (day) => {
    const dayData = getDayData(day);
    if (dayData.totalActivities > 0) {
      setSelectedDay(day);
      setDialogOpen(true);
    }
  };

  const navigateMonth = async (direction) => {
    setSlideDirection(direction === 1 ? "left" : "right");
    setAnimating(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    const newMonth = displayMonth.add(direction, "month");
    setDisplayMonth(newMonth);
    setTimeout(() => setAnimating(false), 100);
  };

  const goToToday = () => {
    setDisplayMonth(dayjs().tz(timezone));
  };

  const getMonthStats = () => {
    const days = getDaysInMonth();
    let totalMeetings = 0;
    let totalCalls = 0;
    let activeDays = 0;

    days.forEach((day) => {
      if (day.month() === displayMonth.month()) {
        const dayData = getDayData(day);
        totalMeetings += dayData.meetings.length;
        totalCalls += dayData.calls.length;
        if (dayData.totalActivities > 0) activeDays++;
      }
    });

    return { totalMeetings, totalCalls, activeDays };
  };

  const days = getDaysInMonth();
  const weekDays = isMobile
    ? ["S", "M", "T", "W", "T", "F", "S"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthYear = displayMonth.format("MMMM YYYY");
  const monthStats = getMonthStats();

  return (
    <>
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {/* Enhanced Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`,
            backdropFilter: "blur(10px)",
            borderBottom: 1,
            borderColor: "divider",
            p: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <IconButton
              onClick={() => navigateMonth(-1)}
              disabled={animating}
              size={isMobile ? "small" : "medium"}
              sx={{
                bgcolor: "background.paper",
                color: "primary.main",
                border: 1,
                borderColor: "primary.200",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                "&:hover": {
                  bgcolor: "primary.50",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                },
                "&:disabled": {
                  opacity: 0.5,
                  transform: "none",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <MdArrowBack />
            </IconButton>

            <Box
              display="flex"
              alignItems="center"
              gap={2}
              flexDirection={isMobile ? "column" : "row"}
            >
              <Typography
                variant={isMobile ? "h5" : "h4"}
                component="h1"
                fontWeight="700"
                color="text.primary"
                sx={{
                  textAlign: "center",
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {monthYear}
              </Typography>

              {!displayMonth.isSame(dayjs().tz(timezone), "month") && (
                <Chip
                  label="Today"
                  onClick={goToToday}
                  size="small"
                  color="primary"
                  variant="filled"
                  clickable
                  icon={<MdToday />}
                  sx={{
                    fontWeight: 600,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                />
              )}
            </Box>

            <IconButton
              onClick={() => navigateMonth(1)}
              disabled={animating}
              size={isMobile ? "small" : "medium"}
              sx={{
                bgcolor: "background.paper",
                color: "primary.main",
                border: 1,
                borderColor: "primary.200",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                "&:hover": {
                  bgcolor: "primary.50",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                },
                "&:disabled": {
                  opacity: 0.5,
                  transform: "none",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <MdArrowForward />
            </IconButton>
          </Box>

          {/* Enhanced Month Statistics */}
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            <Card
              variant="outlined"
              sx={{
                px: 2.5,
                py: 1.5,
                minWidth: 140,
                bgcolor: "background.paper",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                border: 1,
                borderColor: "primary.100",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: "primary.50",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MdEvent color={theme.palette.primary.main} size={20} />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight="700"
                    color="primary.main"
                  >
                    {monthStats.totalMeetings}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight="500"
                  >
                    Meetings
                  </Typography>
                </Box>
              </Stack>
            </Card>

            <Card
              variant="outlined"
              sx={{
                px: 2.5,
                py: 1.5,
                minWidth: 140,
                bgcolor: "background.paper",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                border: 1,
                borderColor: "secondary.100",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: "secondary.50",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MdPhone color={theme.palette.secondary.main} size={20} />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight="700"
                    color="secondary.main"
                  >
                    {monthStats.totalCalls}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight="500"
                  >
                    Calls
                  </Typography>
                </Box>
              </Stack>
            </Card>

            <Card
              variant="outlined"
              sx={{
                px: 2.5,
                py: 1.5,
                minWidth: 140,
                bgcolor: "background.paper",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                border: 1,
                borderColor: "success.100",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: "success.50",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MdCalendarToday
                    color={theme.palette.success.main}
                    size={20}
                  />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight="700"
                    color="success.main"
                  >
                    {monthStats.activeDays}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight="500"
                  >
                    Active Days
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Box>

        {/* Admin Controls */}
        {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
          <Box
            sx={{
              px: 3,
              py: 2,
              bgcolor: "background.default",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={isAdmin}
                  onChange={handleSwitchChange}
                  color="primary"
                />
              }
              label="Get data for yourself only"
              sx={{
                "& .MuiFormControlLabel-label": {
                  color: "text.secondary",
                  fontWeight: 500,
                },
              }}
            />
          </Box>
        )}

        {/* Enhanced Calendar Grid */}
        <CardContent sx={{ p: 0, position: "relative", overflow: "hidden" }}>
          {animating && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(2px)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box sx={{ textAlign: "center" }}>
                <CircularProgress color="primary" size={40} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  Loading {slideDirection === "left" ? "next" : "previous"}{" "}
                  month...
                </Typography>
              </Box>
            </Box>
          )}

          <Grid
            container
            sx={{
              opacity: animating ? 0.4 : 1,
              transform: animating
                ? `translateX(${slideDirection === "left" ? "-10px" : "10px"})`
                : "translateX(0)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Enhanced Week Days Header */}
            {weekDays.map((day, index) => (
              <Grid key={day} size={12 / 7}>
                <Box
                  textAlign="center"
                  py={2.5}
                  sx={{
                    bgcolor: "grey.50",
                    borderRight: index < 6 ? 1 : 0,
                    borderColor: "divider",
                    borderBottom: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="700"
                    color="text.primary"
                    sx={{
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {day}
                  </Typography>
                </Box>
              </Grid>
            ))}

            {/* Enhanced Calendar Days */}
            {days.map((day, index) => {
              const dayData = getDayData(day);
              const hasActivities = dayData.totalActivities > 0;
              const isWeekend = day.day() === 0 || day.day() === 6;

              return (
                <Grid key={index} size={12 / 7}>
                  <Paper
                    elevation={0}
                    onClick={() => handleDayClick(day)}
                    sx={{
                      minHeight: isMobile ? 110 : isTablet ? 130 : 160,
                      display: "flex",
                      flexDirection: "column",
                      p: 1.5,
                      cursor: hasActivities ? "pointer" : "default",
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 0,
                      position: "relative",
                      bgcolor: dayData.isToday
                        ? "primary.50"
                        : isWeekend && dayData.isCurrentMonth
                        ? "grey.25"
                        : dayData.isCurrentMonth
                        ? "background.paper"
                        : "grey.50",
                      "&:hover": hasActivities
                        ? {
                            bgcolor: dayData.isToday
                              ? "primary.100"
                              : "action.hover",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                            zIndex: 2,
                            transform: "translateY(-2px)",
                          }
                        : {},
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      opacity: dayData.isCurrentMonth ? 1 : 0.5,
                    }}
                  >
                    {/* Enhanced Day Number */}
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: dayData.isToday ? 32 : "auto",
                          height: dayData.isToday ? 32 : "auto",
                          borderRadius: dayData.isToday ? "50%" : 0,
                          bgcolor: dayData.isToday
                            ? "primary.main"
                            : "transparent",
                          color: dayData.isToday
                            ? "primary.contrastText"
                            : isWeekend
                            ? "text.secondary"
                            : "text.primary",
                          boxShadow: dayData.isToday
                            ? "0 2px 8px rgba(0,0,0,0.2)"
                            : "none",
                        }}
                      >
                        <Typography
                          variant={isMobile ? "body2" : "body1"}
                          fontWeight={
                            dayData.isToday ? "bold" : isWeekend ? "500" : "600"
                          }
                          sx={{
                            opacity:
                              dayData.isPast && !dayData.isToday ? 0.6 : 1,
                          }}
                        >
                          {day.date()}
                        </Typography>
                      </Box>

                      {hasActivities && (
                        <Chip
                          label={dayData.totalActivities}
                          size="small"
                          color="primary"
                          sx={{
                            height: 22,
                            minWidth: 22,
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                            fontWeight: "bold",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                            "& .MuiChip-label": {
                              px: 0.75,
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                            },
                          }}
                        />
                      )}
                    </Box>

                    {/* Enhanced Activities */}
                    <Box sx={{ flex: 1, overflow: "hidden" }}>
                      {loading ? (
                        <Stack spacing={1}>
                          <Skeleton
                            variant="rectangular"
                            height={18}
                            sx={{ borderRadius: 1 }}
                          />
                          <Skeleton
                            variant="rectangular"
                            height={18}
                            sx={{ borderRadius: 1 }}
                          />
                        </Stack>
                      ) : (
                        <Stack spacing={0.75}>
                          {dayData.meetings.length > 0 && (
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 0.75,
                                bgcolor: "primary.50",
                                borderColor: "primary.200",
                                borderRadius: 1.5,
                                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                              }}
                            >
                              <Stack
                                direction="row"
                                spacing={0.75}
                                alignItems="center"
                              >
                                <Box
                                  sx={{
                                    p: 0.5,
                                    borderRadius: 1,
                                    bgcolor: "primary.100",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <MdEvent
                                    size={10}
                                    color={theme.palette.primary.main}
                                  />
                                </Box>
                                <Typography
                                  variant="caption"
                                  color="primary.dark"
                                  fontWeight="700"
                                  sx={{ fontSize: "0.7rem" }}
                                >
                                  {dayData.meetings.length} Meeting
                                  {dayData.meetings.length > 1 ? "s" : ""}
                                </Typography>
                              </Stack>
                            </Paper>
                          )}

                          {dayData.calls.length > 0 && (
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 0.75,
                                bgcolor: "secondary.50",
                                borderColor: "secondary.200",
                                borderRadius: 1.5,
                                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                              }}
                            >
                              <Stack
                                direction="row"
                                spacing={0.75}
                                alignItems="center"
                              >
                                <Box
                                  sx={{
                                    p: 0.5,
                                    borderRadius: 1,
                                    bgcolor: "secondary.100",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <MdPhone
                                    size={10}
                                    color={theme.palette.secondary.main}
                                  />
                                </Box>
                                <Typography
                                  variant="caption"
                                  color="secondary.dark"
                                  fontWeight="700"
                                  sx={{ fontSize: "0.7rem" }}
                                >
                                  {dayData.calls.length} Call
                                  {dayData.calls.length > 1 ? "s" : ""}
                                </Typography>
                              </Stack>
                            </Paper>
                          )}
                        </Stack>
                      )}
                    </Box>

                    {/* Enhanced Activity indicator */}
                    {hasActivities && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "success.main",
                          boxShadow:
                            "0 0 0 2px white, 0 2px 4px rgba(0,0,0,0.2)",
                          animation: "pulse 2s infinite",
                          "@keyframes pulse": {
                            "0%": {
                              opacity: 1,
                            },
                            "50%": {
                              opacity: 0.5,
                            },
                            "100%": {
                              opacity: 1,
                            },
                          },
                        }}
                      />
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>

        {/* Enhanced Footer */}
        <CardActions
          sx={{
            p: 3,
            bgcolor: "background.default",
            borderTop: 1,
            borderColor: "divider",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Stack
            direction="row"
            spacing={3}
            alignItems="center"
            flexWrap="wrap"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              />
              <Typography variant="body2" fontWeight="600" color="text.primary">
                Meetings
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  bgcolor: "secondary.main",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              />
              <Typography variant="body2" fontWeight="600" color="text.primary">
                Calls
              </Typography>
            </Stack>
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontStyle: "italic",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <MdInfo size={16} />
            Click highlighted days for details
          </Typography>

          <Chip
            label={`🌍 ${timezone}`}
            variant="outlined"
            size="small"
            sx={{
              fontWeight: 500,
              bgcolor: "background.paper",
            }}
          />
        </CardActions>
      </Card>

      {/* Day Detail Dialog */}
      <DayDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        selectedDay={selectedDay}
        dayData={selectedDay ? getDayData(selectedDay) : null}
        timezone={timezone}
        isAdmin={isAdmin}
      />
    </>
  );
}

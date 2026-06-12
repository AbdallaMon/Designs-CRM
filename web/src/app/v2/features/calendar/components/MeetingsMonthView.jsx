"use client";

// Meeting & Calls month-view. Behavior + appearance PRESERVED from the legacy BigCalendar.jsx
// — data access repointed through calendarService:
//   • month map → GET /v2/calendar/dates/month?year=&month=&isAdmin=   (calendar.view)
//   • day data  → GET /v2/calendar/dates/day?date=&isAdmin=            (calendar.view)
//
// The legacy day-detail dialog embedded the leads-feature CallCard/MeetingCard (with their own
// legacy mutation actions). To keep this feature self-contained on the v2 layer (strangler
// isolation) the day dialog shows a READ-ONLY summary of each meeting/call (date/time/lead/
// type). The lead-level edit actions live in the already-migrated leads feature, not here.

import React, { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Tab,
  Tabs,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
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

import LoadingOverlay from "@/app/v2/shared/components/feedback/LoadingOverlay";
import { useT } from "@/app/v2/lib/i18n";
import { calendarService } from "../calendar.service.js";
import { resolveBrowserTimezone } from "../config/calendarConstants.js";

dayjs.extend(utc);
dayjs.extend(timezone);

function ReminderSummary({ item, tz, icon }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        {icon}
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {item?.client?.name || item?.clientLead?.client?.name || "—"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item?.time ? dayjs(item.time).tz(tz).format("h:mm A") : ""}
            {item?.type ? ` · ${item.type}` : ""}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function DayDetailDialog({ open, onClose, selectedDay, isAdmin, tz }) {
  const { t } = useT();
  const [dayData, setDayData] = useState();
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  async function getDataForADay() {
    const userTimezone = dayjs.tz.guess();
    const submittedUtcDate = dayjs.utc(selectedDay);
    const offsetInMinutes = dayjs().tz(userTimezone).utcOffset();
    const correctedDate = submittedUtcDate.add(offsetInMinutes, "minute");
    try {
      setLoading(true);
      const res = await calendarService.getRemindersForDay({
        date: correctedDate.toISOString(),
        isAdmin,
      });
      setDayData(res?.data);
    } catch {
      setDayData(undefined);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedDay && open) getDataForADay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{selectedDay?.format("MMMM DD, YYYY")}</Typography>
          <IconButton onClick={onClose} size="small">
            <MdClose />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ position: "relative" }}>
        {loading && <LoadingOverlay isLoading />}
        <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab
            label={
              <Badge badgeContent={dayData?.meetings?.length} color="primary">
                <Box display="flex" alignItems="center" gap={1}>
                  <MdEvent fontSize="small" /> {t("calendar.meetings", "المواعيد")}
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={dayData?.calls?.length} color="secondary">
                <Box display="flex" alignItems="center" gap={1}>
                  <MdPhone fontSize="small" /> {t("calendar.calls", "المكالمات")}
                </Box>
              </Badge>
            }
          />
        </Tabs>

        <Box sx={{ maxHeight: 500, overflow: "auto" }}>
          {tabValue === 0 && (
            <Box>
              {!dayData?.meetings?.length ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  {t("calendar.noMeetingsThisDay", "لا توجد مواعيد في هذا اليوم")}
                </Typography>
              ) : (
                dayData.meetings.map((meeting) => (
                  <ReminderSummary
                    key={meeting.id}
                    item={meeting}
                    tz={tz}
                    icon={<MdEvent />}
                  />
                ))
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              {!dayData?.calls?.length ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  {t("calendar.noCallsThisDay", "لا توجد مكالمات في هذا اليوم")}
                </Typography>
              ) : (
                dayData.calls.map((call) => (
                  <ReminderSummary key={call.id} item={call} tz={tz} icon={<MdPhone />} />
                ))
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export function MeetingsMonthView({
  timezone: tz = resolveBrowserTimezone(),
  canSelfFilter = false,
}) {
  const { t } = useT();
  const [displayMonth, setDisplayMonth] = useState(dayjs().tz(tz));
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const res = await calendarService.getCalendarMonth({
        year: displayMonth.year(),
        month: displayMonth.month() + 1,
        isAdmin,
      });
      setCalendarData(res?.data || {});
    } catch {
      setCalendarData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMonth, tz, isAdmin]);

  const getDaysInMonth = () => {
    const startOfMonth = displayMonth.startOf("month");
    const endOfMonth = displayMonth.endOf("month");
    const startDate = startOfMonth.subtract(startOfMonth.day(), "day");
    const endDate = endOfMonth.add(6 - endOfMonth.day(), "day");

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
    const dayMeetings = (dayData.meetings || []).filter(
      (m) => dayjs(m.time).tz(tz).format("YYYY-MM-DD") === dayKey,
    );
    const dayCalls = (dayData.calls || []).filter(
      (c) => dayjs(c.time).tz(tz).format("YYYY-MM-DD") === dayKey,
    );
    return {
      meetings: dayMeetings,
      calls: dayCalls,
      totalActivities: dayMeetings.length + dayCalls.length,
      isCurrentMonth: day.month() === displayMonth.month(),
      isToday: day.isSame(dayjs().tz(tz), "day"),
      isPast: day.isBefore(dayjs().tz(tz), "day"),
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
    setAnimating(true);
    await new Promise((resolve) => setTimeout(resolve, 150));
    setDisplayMonth((prev) => prev.add(direction, "month"));
    setTimeout(() => setAnimating(false), 100);
  };

  const goToToday = () => setDisplayMonth(dayjs().tz(tz));

  const getMonthStats = () => {
    let totalMeetings = 0;
    let totalCalls = 0;
    let activeDays = 0;
    getDaysInMonth().forEach((day) => {
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
        }}
      >
        {/* Header */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", p: 3, bgcolor: "background.default" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <IconButton
              onClick={() => navigateMonth(-1)}
              disabled={animating}
              size={isMobile ? "small" : "medium"}
              sx={{ bgcolor: "background.paper", color: "primary.main", border: 1, borderColor: "divider" }}
            >
              <MdArrowBack />
            </IconButton>

            <Box display="flex" alignItems="center" gap={2} flexDirection={isMobile ? "column" : "row"}>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight="700" color="text.primary">
                {monthYear}
              </Typography>
              {!displayMonth.isSame(dayjs().tz(tz), "month") && (
                <Chip
                  label={t("calendar.today", "اليوم")}
                  onClick={goToToday}
                  size="small"
                  color="primary"
                  clickable
                  icon={<MdToday />}
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>

            <IconButton
              onClick={() => navigateMonth(1)}
              disabled={animating}
              size={isMobile ? "small" : "medium"}
              sx={{ bgcolor: "background.paper", color: "primary.main", border: 1, borderColor: "divider" }}
            >
              <MdArrowForward />
            </IconButton>
          </Box>

          <Stack direction={isMobile ? "column" : "row"} spacing={2} alignItems="center" justifyContent="center">
            <Card variant="outlined" sx={{ px: 2.5, py: 1.5, minWidth: 140 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <MdEvent color={theme.palette.primary.main} size={20} />
                <Box>
                  <Typography variant="h6" fontWeight="700" color="primary.main">
                    {monthStats.totalMeetings}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("calendar.stats.meetings", "مواعيد")}
                  </Typography>
                </Box>
              </Stack>
            </Card>
            <Card variant="outlined" sx={{ px: 2.5, py: 1.5, minWidth: 140 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <MdPhone color={theme.palette.secondary.main} size={20} />
                <Box>
                  <Typography variant="h6" fontWeight="700" color="secondary.main">
                    {monthStats.totalCalls}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("calendar.stats.calls", "مكالمات")}
                  </Typography>
                </Box>
              </Stack>
            </Card>
            <Card variant="outlined" sx={{ px: 2.5, py: 1.5, minWidth: 140 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <MdCalendarToday color={theme.palette.success.main} size={20} />
                <Box>
                  <Typography variant="h6" fontWeight="700" color="success.main">
                    {monthStats.activeDays}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("calendar.stats.activeDays", "أيام نشطة")}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Box>

        {/* Self-filter toggle (admins only) */}
        {canSelfFilter && (
          <Box sx={{ px: 3, py: 2, bgcolor: "background.default", borderBottom: 1, borderColor: "divider" }}>
            <FormControlLabel
              control={<Switch checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} color="primary" />}
              label={t("calendar.showOwnDataOnly", "عرض بياناتك فقط")}
            />
          </Box>
        )}

        <CardContent sx={{ p: 0, position: "relative", overflow: "hidden" }}>
          {animating && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(255,255,255,0.9)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress color="primary" size={40} />
            </Box>
          )}

          <Grid container sx={{ opacity: animating ? 0.4 : 1, transition: "all 0.3s" }}>
            {weekDays.map((day, index) => (
              <Grid key={`${day}-${index}`} size={12 / 7}>
                <Box
                  textAlign="center"
                  py={2.5}
                  sx={{ bgcolor: "grey.50", borderRight: index < 6 ? 1 : 0, borderColor: "divider", borderBottom: 1 }}
                >
                  <Typography variant="subtitle2" fontWeight="700" color="text.primary">
                    {day}
                  </Typography>
                </Box>
              </Grid>
            ))}

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
                          ? "grey.50"
                          : dayData.isCurrentMonth
                            ? "background.paper"
                            : "grey.50",
                      "&:hover": hasActivities
                        ? { bgcolor: dayData.isToday ? "primary.100" : "action.hover", zIndex: 2 }
                        : {},
                      transition: "all 0.2s",
                      opacity: dayData.isCurrentMonth ? 1 : 0.5,
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: dayData.isToday ? 32 : "auto",
                          height: dayData.isToday ? 32 : "auto",
                          borderRadius: dayData.isToday ? "50%" : 0,
                          bgcolor: dayData.isToday ? "primary.main" : "transparent",
                          color: dayData.isToday ? "primary.contrastText" : "text.primary",
                        }}
                      >
                        <Typography variant={isMobile ? "body2" : "body1"} fontWeight={dayData.isToday ? "bold" : "600"}>
                          {day.date()}
                        </Typography>
                      </Box>
                      {hasActivities && (
                        <Chip
                          label={dayData.totalActivities}
                          size="small"
                          color="primary"
                          sx={{ height: 22, minWidth: 22 }}
                        />
                      )}
                    </Box>

                    <Box sx={{ flex: 1, overflow: "hidden" }}>
                      {loading ? (
                        <Stack spacing={1}>
                          <Skeleton variant="rectangular" height={18} sx={{ borderRadius: 1 }} />
                          <Skeleton variant="rectangular" height={18} sx={{ borderRadius: 1 }} />
                        </Stack>
                      ) : (
                        <Stack spacing={0.75}>
                          {dayData.meetings.length > 0 && (
                            <Paper variant="outlined" sx={{ p: 0.75, bgcolor: "primary.50", borderRadius: 1.5 }}>
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <MdEvent size={10} color={theme.palette.primary.main} />
                                <Typography variant="caption" color="primary.dark" fontWeight="700" sx={{ fontSize: "0.7rem" }}>
                                  {t("calendar.meetingCount", "{count} موعد").replace("{count}", dayData.meetings.length)}
                                </Typography>
                              </Stack>
                            </Paper>
                          )}
                          {dayData.calls.length > 0 && (
                            <Paper variant="outlined" sx={{ p: 0.75, bgcolor: "secondary.50", borderRadius: 1.5 }}>
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <MdPhone size={10} color={theme.palette.secondary.main} />
                                <Typography variant="caption" color="secondary.dark" fontWeight="700" sx={{ fontSize: "0.7rem" }}>
                                  {t("calendar.callCount", "{count} مكالمة").replace("{count}", dayData.calls.length)}
                                </Typography>
                              </Stack>
                            </Paper>
                          )}
                        </Stack>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>

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
          <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "primary.main" }} />
              <Typography variant="body2" fontWeight="600">
                {t("calendar.meetings", "المواعيد")}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "secondary.main" }} />
              <Typography variant="body2" fontWeight="600">
                {t("calendar.calls", "المكالمات")}
              </Typography>
            </Stack>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MdInfo size={16} /> {t("calendar.clickHighlightedDays", "اضغط على الأيام المميزة لعرض التفاصيل")}
          </Typography>
          <Chip label={`🌍 ${tz}`} variant="outlined" size="small" />
        </CardActions>
      </Card>

      <DayDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        selectedDay={selectedDay}
        isAdmin={isAdmin}
        tz={tz}
      />
    </>
  );
}

export default MeetingsMonthView;

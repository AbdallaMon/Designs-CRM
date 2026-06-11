"use client";

// Slot-configuration dialog. Behavior + appearance PRESERVED from the legacy
// Calendar.jsx `TimeSlotManager` — data access repointed through calendarService:
//   • generate slots → POST /v2/calendar/available-days(/multiple)?timezone=  (calendar.manage)
//   • read slots     → GET  /v2/calendar/slots?date=&adminId=&timezone=       (calendar.view)
//   • delete a slot  → DELETE /v2/calendar/slots/:id                          (calendar.manage)
//   • delete a day   → DELETE /v2/calendar/days/:id                           (calendar.manage)
//
// §5c / contract notes:
//   • The legacy "Add Custom slot" action (POST /calendar-management/add-custom/:dayId) has
//     NO v2 endpoint and is intentionally REMOVED (reported as a deferred delta).
//   • Write buttons are gated on `canManage` (= hasPermission(calendar.manage)); STAFF (who
//     lack it / manage another admin's days) see read-only slots, exactly as legacy gated
//     STAFF out of generate/delete.

import React, { useEffect, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  lighten,
} from "@mui/material";
import {
  MdSchedule as Schedule,
  MdDelete as DeleteIcon,
  MdClose as Close,
} from "react-icons/md";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import LoadingOverlay from "@/app/v2/shared/components/feedback/LoadingOverlay";
import { calendarService } from "../calendar.service.js";
import { runCalendarMutation } from "../calendar.mutations.js";
import { DEFAULT_TIMEZONE, SLOT_DEFAULTS } from "../config/calendarConstants.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export function TimeSlotManager({
  open,
  onClose,
  date,
  timezone: tz = DEFAULT_TIMEZONE,
  isMultiDate = false,
  selectedDates = [],
  dayId,
  setRerender,
  adminId,
  onUpdate,
  setDayId,
  selectedDate,
  canManage = false,
}) {
  const [startTime, setStartTime] = useState(SLOT_DEFAULTS.startTime);
  const [endTime, setEndTime] = useState(SLOT_DEFAULTS.endTime);
  const [slots, setSlots] = useState([]);
  const [meetingDuration, setMeetingDuration] = useState(SLOT_DEFAULTS.meetingDuration);
  const [breakDuration, setBreakDuration] = useState(SLOT_DEFAULTS.breakDuration);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(false);

  const getSlotsData = async () => {
    if (!selectedDate) return;
    const dateParam = dayjs(selectedDate).format("YYYY-MM-DD");
    try {
      setLoading(true);
      const res = await calendarService.getSlots({ date: dateParam, adminId, timezone: tz });
      const list = Array.isArray(res?.data) ? res.data : [];
      setSlots(list);
      if (list.length > 0) setDayId(list[0].availableDayId);
      setRerender((prev) => !prev);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const generateSlots = async () => {
    if (!canManage) return;
    if (!startTime || !endTime || !meetingDuration || !breakDuration) return;

    const dateStr = date ? dayjs(date).format("YYYY-MM-DD") : null;
    const daysStr = selectedDates.map((d) => dayjs(d).format("YYYY-MM-DD"));

    const body = {
      date: dateStr,
      days: daysStr,
      fromHour: startTime,
      toHour: endTime,
      duration: meetingDuration,
      breakMinutes: breakDuration,
    };

    const res = await runCalendarMutation(
      () =>
        isMultiDate
          ? calendarService.createMultipleDays(body, { timezone: tz })
          : calendarService.createDay(body, { timezone: tz }),
      { loading: "جاري حفظ المواعيد..." },
    );
    if (res) {
      if (isMultiDate) {
        window.location.reload();
        return;
      }
      await getSlotsData();
      await onUpdate?.();
    }
  };

  const deleteSlot = async (slotId) => {
    if (!canManage) return;
    const res = await runCalendarMutation(() => calendarService.deleteSlot(slotId), {
      loading: "جاري حذف الموعد...",
    });
    if (res) {
      await getSlotsData();
      await onUpdate?.();
    }
  };

  const deleteDay = async () => {
    if (!canManage || !dayId) return;
    const res = await runCalendarMutation(() => calendarService.deleteDay(dayId), {
      loading: "جاري حذف اليوم...",
    });
    if (res) {
      await getSlotsData();
      setDayId(null);
      await onUpdate?.();
    }
  };

  useEffect(() => {
    if (!isMultiDate && selectedDate) {
      getSlotsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMultiDate, selectedDates, selectedDate]);

  const groupedSlots = isMultiDate
    ? {}
    : slots.reduce((acc, slot) => {
        const dateKey = slot.date || dayjs(slot.startTime).format("YYYY-MM-DD");
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(slot);
        return acc;
      }, {});

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      slotProps={{ paper: { sx: { borderRadius: isMobile ? 0 : 3 } } }}
    >
      {loading && <LoadingOverlay isLoading />}
      {isMobile && (
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onClose}>
              <Close />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              إعداد المواعيد
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {!isMobile && (
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight="600">
            إعداد المواعيد
          </Typography>
          {isMultiDate && (
            <Typography variant="body2" color="text.secondary">
              {selectedDates.length} يوم محدد
            </Typography>
          )}
        </DialogTitle>
      )}

      <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
        {canManage && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              إعدادات توليد المواعيد
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  label="وقت البدء"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  label="وقت الانتهاء"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  label="المدة (دقيقة)"
                  type="number"
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(Number(e.target.value))}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  label="الاستراحة (دقيقة)"
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
                توليد المواعيد
              </Button>
            </Stack>
          </Box>
        )}

        <Box>
          <Typography variant="h6" gutterBottom fontWeight="600">
            المواعيد المُولّدة ({slots.length})
          </Typography>

          {!isMultiDate &&
            !loading &&
            Object.entries(groupedSlots).map(([dateKey, dateSlots]) => (
              <Paper
                key={dateKey}
                elevation={0}
                sx={{ mb: 2, p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
              >
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                  {dayjs(dateKey).format("dddd, MMMM D, YYYY")}
                </Typography>
                <Grid container spacing={1}>
                  {dateSlots.map((slot) => (
                    <Grid size={{ sm: 6, md: 4 }} key={slot.id}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="body2" fontWeight="500">
                                {dayjs(slot.startTime).tz(tz).format("h:mm A")} -{" "}
                                {dayjs(slot.endTime).tz(tz).format("h:mm A")}
                              </Typography>
                              <Chip
                                size="small"
                                label={slot.isBooked ? "محجوز" : "متاح"}
                                color={slot.isBooked ? "error" : "success"}
                                variant="outlined"
                                sx={{
                                  mt: 1,
                                  bgcolor: slot.isBooked
                                    ? lighten(theme.palette.error.main, 0.2)
                                    : lighten(theme.palette.success.main, 0.2),
                                }}
                              />
                            </Box>
                            {canManage && (
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
        {dayId && canManage && (
          <Button
            startIcon={<DeleteIcon />}
            color="error"
            onClick={deleteDay}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            حذف اليوم
          </Button>
        )}
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TimeSlotManager;

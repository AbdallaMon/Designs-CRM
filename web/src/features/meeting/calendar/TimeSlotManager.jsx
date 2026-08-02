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
import FullScreenLoader from "@/shared/components/feedback/loaders/FullscreenLoader";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekday);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale("en");

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

    // Send ONLY the field the target endpoint accepts: the single-day endpoint validates
    // a `date` (strict, no `days`) and the multiple endpoint validates `days` (strict, no
    // `date`). Sending both 422'd with "Unrecognized key" on whichever the schema lacked.
    const slotKnobs = {
      fromHour: startTime,
      toHour: endTime,
      duration: meetingDuration,
      breakMinutes: breakDuration,
    };

    let url;
    let data;
    if (isMultiDate) {
      data = { days: daysStr, ...slotKnobs };
      url = `calendar-management/available-days/multiple?timezone=${tz}&isMobile=${
        isMobile ? 1 : 0
      }&`;
    } else {
      data = { date: dateStr, ...slotKnobs };
      url = `calendar-management/available-days?timezone=${tz}&isMobile=${
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
      `calendar-management/slots/${slotId}`,
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
        `calendar-management/add-custom/${dayId}?timezone=${tz}&isMobile=${
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
      url: `calendar-management/slots?date=${dateParam}&adminId=${adminId}&timezone=${tz}&`,
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
      `calendar-management/days/${dayId}`,
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

export default TimeSlotManager;

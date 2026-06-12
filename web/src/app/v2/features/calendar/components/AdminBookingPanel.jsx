"use client";

// Availability management panel — single/multi-day selection driving the TimeSlotManager.
// Behavior + appearance PRESERVED from the legacy Calendar.jsx `AdminBookingPanel`. Write
// actions are gated on `canManage` (= hasPermission(calendar.manage)); the calendar/slot
// reads are gated on calendar.view (the panel is only mounted when the user can view).

import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Switch,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import dayjs from "dayjs";

import AvailabilityCalendar from "./AvailabilityCalendar.jsx";
import TimeSlotManager from "./TimeSlotManager.jsx";
import { resolveBrowserTimezone } from "../config/calendarConstants.js";

export function AdminBookingPanel({
  timezone: tz = resolveBrowserTimezone(),
  adminId,
  type = "ADMIN",
  canManage = false,
  title = "إدارة التوفر",
}) {
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
        <Typography variant="h5" gutterBottom fontWeight="700">
          {title}
        </Typography>
        {canManage && (
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
            label="تحديد أيام متعددة"
          />
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <AvailabilityCalendar
            selectedDate={selectedDate}
            selectedDates={selectedDates}
            onDateSelect={handleDateSelect}
            multiSelect={multiSelectMode}
            timezone={tz}
            isAdmin
            rerender={rerender}
            adminId={adminId}
            type={type}
          />

          {multiSelectMode && selectedDates.length > 0 && (
            <Paper
              elevation={0}
              sx={{ mt: 2, p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}
            >
              <Typography variant="h6" gutterBottom fontWeight="600">
                الأيام المحددة ({selectedDates.length})
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                {selectedDates.map((date, index) => (
                  <Chip
                    key={index}
                    label={dayjs(date).format("MMM D")}
                    onDelete={() =>
                      setSelectedDates(selectedDates.filter((d) => !dayjs(d).isSame(date, "day")))
                    }
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
                  إعداد الأيام المحددة
                </Button>
                <Button variant="outlined" onClick={clearSelection} sx={{ borderRadius: 2 }}>
                  مسح التحديد
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
        adminId={adminId}
        setDayId={setDayId}
        selectedDate={selectedDate}
        canManage={canManage}
      />
    </Box>
  );
}

export default AdminBookingPanel;

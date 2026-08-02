"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Badge,
} from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { MdClose, MdEvent, MdPhone } from "react-icons/md";
import { CallCard, MeetingCard } from "@/features/leads/core/CallAndMeetingCard.jsx";
import { getData } from "@/app/helpers/functions/getData";
import LoadingOverlay from "@/shared/components/feedback/loaders/LoadingOverlay";

dayjs.extend(utc);
dayjs.extend(timezone);

const DayDetailDialog = ({ open, onClose, selectedDay, isAdmin }) => {
  const [dayData, setDayData] = useState();
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  async function getDataForADay() {
    const userTimezone = dayjs.tz.guess();
    const submittedUtcDate = dayjs.utc(selectedDay);
    const offsetInMinutes = dayjs().tz(userTimezone).utcOffset(); // e.g. 180
    const correctedDate = submittedUtcDate.add(offsetInMinutes, "minute");
    const req = await getData({
      url: `calendar-management/dates/day?date=${correctedDate}&isAdmin=${isAdmin}&`,
      setLoading,
    });

    if (req.status === 200) {
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

export default DayDetailDialog;

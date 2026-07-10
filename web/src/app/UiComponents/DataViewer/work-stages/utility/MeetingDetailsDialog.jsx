"use client";

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(relativeTime);

import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";

import { FiClock, FiUser, FiExternalLink } from "react-icons/fi";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";

function MeetingDetailsDialog({ open, onClose, meetingId }) {
  const [loading, setLoading] = useState(false);
  const [meeting, setMeeting] = useState(null);
  useEffect(() => {
    let active = true;
    if (!open || !meetingId) return;

    (async () => {
      if (!active) return;
      await getDataAndSet({
        url: `shared/client-leads/meeting-reminders/${meetingId}`,
        setLoading,
        setData: setMeeting,
      });
    })();

    return () => {
      active = false;
    };
  }, [open, meetingId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <FiExternalLink />
          <span>Meeting Details #{meetingId}</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
          </Stack>
        ) : !meeting ? (
          <Typography color="text.secondary">Meeting not found.</Typography>
        ) : (
          <Stack spacing={1.2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FiClock />
              <Typography>
                Time:{" "}
                <b>
                  {dayjs(meeting.time).format("YYYY-MM-DD HH:mm")} (
                  {dayjs(meeting.time).fromNow()})
                </b>
              </Typography>
            </Stack>

            <Typography>
              Status: <Chip size="small" label={meeting.status} />
            </Typography>

            <Typography>Result: {meeting.meetingResult || <i>—</i>}</Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={0.8} alignItems="center">
                <FiUser />
                <Typography>
                  User: <b>{meeting.user?.name}</b>
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MeetingDetailsDialog;

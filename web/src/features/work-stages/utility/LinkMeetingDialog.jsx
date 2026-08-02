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
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

import { FiLink } from "react-icons/fi";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";

function LinkMeetingDialog({
  open,
  onClose,
  clientLeadId,
  onLink,
  deliveryId,
}) {
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    let active = true;
    if (!open) return;
    (async () => {
      if (active) {
        await getDataAndSet({
          url: `leads/${clientLeadId}/meeting-reminders`,
          setLoading,
          setData: setMeetings,
        });
      }
    })();
    return () => {
      active = false;
    };
  }, [open, clientLeadId]);

  const handleConfirm = async () => {
    if (!selectedId) return;
    await onLink({ deliveryId, meetingReminderId: selectedId });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <FiLink />
          <span>Link Delivery to Meeting</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
          </Stack>
        ) : meetings.length === 0 ? (
          <Typography color="text.secondary">
            No meetings found for this lead.
          </Typography>
        ) : (
          <RadioGroup
            value={selectedId || ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
          >
            {meetings.map((m) => (
              <Box key={m.id} sx={{ p: 1, borderRadius: 1 }}>
                <FormControlLabel
                  value={m.id}
                  control={<Radio />}
                  label={
                    <Stack spacing={0.3}>
                      <Typography>
                        #{m.id} – {dayjs(m.time).format("YYYY-MM-DD HH:mm")} (
                        {dayjs(m.time).fromNow()})
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Result: {m.meetingResult || "—"}
                      </Typography>
                    </Stack>
                  }
                />
                <Divider />
              </Box>
            ))}
          </RadioGroup>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          disabled={!selectedId}
          onClick={handleConfirm}
          variant="contained"
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default LinkMeetingDialog;

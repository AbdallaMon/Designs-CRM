"use client";
import React, { useEffect, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { BsPlus } from "react-icons/bs";
import { useAlertContext } from "@/app/providers/MuiAlert.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.jsx";
import { IoMdCall } from "react-icons/io";
import {
  CALL_REMINDER_STATUSES,
  REMINDER_TYPES,
  USER_FEEDBACK_MESSAGES as FEEDBACK,
} from "@dms/shared";
import dayjs from "dayjs";

import utc from "dayjs/plugin/utc";
import { OpenButton } from "@/features/leads/dialogs/OpenButton.jsx";

dayjs.extend(utc);
export const CallResultDialog = ({
  lead,
  setleads,
  call,
  text = "Update call result",
  type = "button",
  children,
  setCallReminders,
  reminderType = REMINDER_TYPES.CALL,
  onUpdate,
}) => {
  const [result, setResult] = useState("");
  const [status, setStatus] = useState(CALL_REMINDER_STATUSES.DONE);
  const [open, setOpen] = useState(false);
  // Next-step plan (backend "required with escape": closing the LAST touchpoint on an
  // active lead 422s unless the next touch is scheduled or a no-follow-up reason given).
  const [followUpMode, setFollowUpMode] = useState("NONE");
  const [nextTime, setNextTime] = useState("");
  const [nextReason, setNextReason] = useState("");
  const [noFollowUpReason, setNoFollowUpReason] = useState("");

  const { setAlertError } = useAlertContext();
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const theme = useTheme();

  function onClose() {
    setOpen(false);
  }

  function handleOpen() {
    setOpen(true);
  }

  const changeCallStatus = async () => {
    if (!result.trim() && status === CALL_REMINDER_STATUSES.DONE) {
      setAlertError(FEEDBACK.WRITE_CALL_RESULT);
      return;
    }
    const requestedData = {
      userId: user.id,
      status,
    };
    if (reminderType === REMINDER_TYPES.MEETING) {
      requestedData.meetingResult = result;
    } else {
      requestedData.callResult = result;
    }
    if (followUpMode === "SCHEDULE_CALL" || followUpMode === "SCHEDULE_MEETING") {
      if (!nextTime) {
      setAlertError(FEEDBACK.PICK_NEXT_TOUCHPOINT);
        return;
      }
      requestedData.next = {
          type:
            followUpMode === "SCHEDULE_MEETING"
              ? REMINDER_TYPES.MEETING
              : REMINDER_TYPES.CALL,
        time: dayjs(nextTime).utc().toISOString(),
        reason: nextReason || undefined,
      };
    } else if (followUpMode === "NO_FOLLOW_UP") {
      if (noFollowUpReason.trim().length < 3) {
      setAlertError(FEEDBACK.WRITE_NO_FOLLOWUP_REASON);
        return;
      }
      requestedData.noFollowUp = { reason: noFollowUpReason.trim() };
    }

    const request = await handleRequestSubmit(
      requestedData,
      setLoading,
      `leads/${
        reminderType === REMINDER_TYPES.MEETING
          ? "meeting-reminders"
          : "call-reminders"
      }/${call.id}`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (request.status === 200) {
      if (onUpdate) {
        onUpdate();
      }
      if (setCallReminders) {
        setCallReminders((oldCalls) =>
          oldCalls.map((c) => {
            return c.id === request.data.id ? request.data : c;
          })
        );
      }

      if (setleads) {
        setleads((oldLeads) =>
          oldLeads.map((l) => {
            if (l.id === lead.id) {
      if (reminderType === REMINDER_TYPES.MEETING) {
                l.meetingReminders = [
                  request.data,
                  ...l.meetingReminders?.filter(
                    (meeting) => meeting.id !== request.data.id
                  ),
                ];
              } else {
                l.callReminders = [
                  request.data,
                  ...l.callReminders?.filter(
                    (call) => call.id !== request.data.id
                  ),
                ];
              }
            }
            return l;
          })
        );
      }
      setOpen(false);
      setResult("");
    }
  };
  return (
    <>
      {type === "button" ? (
        <Button
          startIcon={<IoMdCall size={20} />}
          onClick={handleOpen}
          sx={{ alignSelf: "flex-start" }}
          variant="outlined"
        >
          {text}
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider", py: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  fontSize: 20,
                }}
              >
                <IoMdCall />
              </Box>
              <Typography variant="h6" fontWeight={700}>
                {text}
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ "&.MuiDialogContent-root": { pt: 4 } }}>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel id="call-status-label">Status</InputLabel>
                <Select
                  labelId="call-status-label"
                  label="Status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                  }}
                >
                  <MenuItem value={CALL_REMINDER_STATUSES.DONE}>Done</MenuItem>
                  <MenuItem value={CALL_REMINDER_STATUSES.MISSED}>Missed</MenuItem>
                </Select>
              </FormControl>
              {status === CALL_REMINDER_STATUSES.DONE && (
                <TextField
                  autoFocus
                  label="Result"
                  fullWidth
                  multiline
                  minRows={3}
                  variant="outlined"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="Summarize the outcome of this call..."
                />
              )}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                  Next step
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                  Required when this is the last scheduled touchpoint on an active lead —
                  never leave a deal without a next step.
                </Typography>
                <FormControl fullWidth>
                  <InputLabel id="follow-up-mode-label">Plan</InputLabel>
                  <Select
                    labelId="follow-up-mode-label"
                    label="Plan"
                    value={followUpMode}
                    onChange={(e) => setFollowUpMode(e.target.value)}
                  >
                    <MenuItem value="NONE">Nothing extra (another touchpoint already scheduled)</MenuItem>
                    <MenuItem value="SCHEDULE_CALL">Schedule the next call</MenuItem>
                    <MenuItem value="SCHEDULE_MEETING">Schedule the next meeting</MenuItem>
                    <MenuItem value="NO_FOLLOW_UP">No follow-up needed (give a reason)</MenuItem>
                  </Select>
                </FormControl>
                {(followUpMode === "SCHEDULE_CALL" || followUpMode === "SCHEDULE_MEETING") && (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <TextField
                      type="datetime-local"
                      label={followUpMode === "SCHEDULE_MEETING" ? "Next meeting time" : "Next call time"}
                      value={nextTime}
                      onChange={(e) => setNextTime(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Reason (optional)"
                      value={nextReason}
                      onChange={(e) => setNextReason(e.target.value)}
                      fullWidth
                      placeholder="Why this follow-up?"
                    />
                  </Stack>
                )}
                {followUpMode === "NO_FOLLOW_UP" && (
                  <TextField
                    label="Why is no follow-up needed?"
                    value={noFollowUpReason}
                    onChange={(e) => setNoFollowUpReason(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    sx={{ mt: 2 }}
                    placeholder="e.g. client asked to pause until next month — saved as a lead note"
                  />
                )}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: 1, borderColor: "divider" }}>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              onClick={changeCallStatus}
              variant="contained"
              color="primary"
              disabled={!result.trim() && status === CALL_REMINDER_STATUSES.DONE}
              sx={{ textTransform: "none", fontWeight: 600, px: 3 }}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export const NewCallDialog = ({
  lead,
  setleads,
  type = "button",
  children,
  setCallReminders,
  reminderType,
}) => {
  const [callData, setCallData] = useState({ time: "", reminderReason: "" });
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const theme = useTheme();
  function handleOpen() {
    setOpen(true);
  }
  const reminderName =
    reminderType === REMINDER_TYPES.MEETING ? "Meeting" : "Call";
  function onClose() {
    setCallData({ time: "", reminderReason: "" });
    setOpen(false);
  }
  const handleAddNewCall = async () => {
    const request = await handleRequestSubmit(
      {
        reminderReason: callData.reminderReason,
        time: dayjs(callData.time).utc().toISOString(),
        userId: user.id,
      },
      setLoading,
      `leads/${lead.id}/${
        reminderType === REMINDER_TYPES.MEETING
          ? "meeting-reminders"
          : "call-reminders"
      }`,
      false,
      "Creating"
    );
    if (request.status === 200) {
      if (setCallReminders) {
        setCallReminders((oldCalls) => [request.data.newReminder, ...oldCalls]);
      }
      if (setleads) {
        setleads((oldLeads) =>
          oldLeads.map((l) => {
            if (l.id === lead.id) {
      if (reminderType === REMINDER_TYPES.MEETING) {
                l.meetingReminders = request.data.latestTwo;
              } else {
                l.callReminders = request.data.latestTwo;
              }
            }
            return l;
          })
        );
      }
      setCallData({ time: "", reminderReason: "" });
      setOpen(false);
    }
  };

  return (
    <>
      {type === "button" ? (
        <Button
          onClick={handleOpen}
          variant="contained"
          startIcon={<BsPlus size={20} />}
          sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 600 }}
        >
          Schedule New {reminderName}
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider", py: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  fontSize: 20,
                }}
              >
                <IoMdCall />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                  Schedule New {reminderName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pick a time and add a reason
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ "&.MuiDialogContent-root": { pt: 4 } }}>
            <Stack spacing={3}>
              <TextField
                type="datetime-local"
                label={`${reminderName} Time`}
                value={callData.time}
                onChange={(e) =>
                  setCallData({ ...callData, time: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Reminder Reason"
                value={callData.reminderReason}
                onChange={(e) =>
                  setCallData({ ...callData, reminderReason: e.target.value })
                }
                fullWidth
                multiline
                minRows={3}
                placeholder={`Why are you scheduling this ${reminderName.toLowerCase()}?`}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: 1, borderColor: "divider" }}>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddNewCall}
              variant="contained"
              color="primary"
              sx={{ textTransform: "none", fontWeight: 600, px: 3 }}
            >
              Schedule
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

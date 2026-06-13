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
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import { IoMdCall } from "react-icons/io";
import dayjs from "dayjs";

import utc from "dayjs/plugin/utc";
import { OpenButton } from "./OpenButton";

dayjs.extend(utc);
export const CallResultDialog = ({
  lead,
  setleads,
  call,
  text = "Update call result",
  type = "button",
  children,
  setCallReminders,
  reminderType = "CALL",
  onUpdate,
}) => {
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("DONE");
  const [open, setOpen] = useState(false);

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
    if (!result.trim() && status === "DONE") {
      setAlertError("Write the result of the call");
      return;
    }
    const requestedData = {
      userId: user.id,
      status,
    };
    if (reminderType === "MEETING") {
      requestedData.meetingResult = result;
    } else {
      requestedData.callResult = result;
    }

    const request = await handleRequestSubmit(
      requestedData,
      setLoading,
      `shared/client-leads/${
        reminderType === "MEETING" ? "meeting-reminders" : "call-reminders"
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
              if (reminderType === "MEETING") {
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
          <DialogContent sx={{ pt: 3 }}>
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
                  <MenuItem value="DONE">Done</MenuItem>
                  <MenuItem value="MISSED">Missed</MenuItem>
                </Select>
              </FormControl>
              {status === "DONE" && (
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
              disabled={!result.trim() && status === "DONE"}
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
  const reminderName = reminderType === "MEETING" ? "Meeting" : "Call";
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
      `shared/client-leads/${lead.id}/${
        reminderType === "MEETING" ? "meeting-reminders" : "call-reminders"
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
              if (reminderType === "MEETING") {
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
          <DialogContent sx={{ pt: 3 }}>
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

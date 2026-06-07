"use client";

// Call / meeting reminder dialogs — ports the legacy NewCallDialog + CallResultDialog
// (DataViewer/leads/dialogs/CallsDialog.jsx) onto the v2 leads service + capability
// gating + Arabic. The reminderType prop ("CALL" | "MEETING") routes to the matching
// service method so one component covers both sub-resources (legacy did the same).
//
// Capability gating (§5c): the "schedule" button renders only when the matching
// capability is true (canAddCall / canAddMeeting). The parent passes it down.

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { BsPlus } from "react-icons/bs";
import { IoMdCall } from "react-icons/io";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { leadsService } from "@/app/v2/features/leads/leads.service.js";
import { runLeadMutation } from "@/app/v2/features/leads/leads.mutations.js";

dayjs.extend(utc);

const LABEL = { CALL: "مكالمة", MEETING: "اجتماع" };

export function NewCallMeetingDialog({ lead, reminderType = "CALL", canAdd, onCreated }) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const [reminderReason, setReminderReason] = useState("");
  const { setLoading } = useToastContext();
  const name = LABEL[reminderType];

  if (!canAdd) return null;

  function reset() {
    setTime("");
    setReminderReason("");
  }
  function onClose() {
    reset();
    setOpen(false);
  }

  async function handleCreate() {
    const body = {
      reminderReason,
      time: dayjs(time).utc().toISOString(),
    };
    const fn =
      reminderType === "MEETING"
        ? () => leadsService.createMeeting(lead.id, body)
        : () => leadsService.createCall(lead.id, body);
    const res = await runLeadMutation(fn, { setLoading, loading: "جاري الإنشاء..." });
    if (res) {
      onCreated?.(res.data);
      onClose();
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="contained"
        startIcon={<BsPlus size={20} />}
        sx={{ alignSelf: "flex-start" }}
      >
        جدولة {name} جديد
      </Button>
      {open && (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth dir="rtl">
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
            جدولة {name} جديد
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                type="datetime-local"
                label={`وقت ال${name}`}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="سبب التذكير"
                value={reminderReason}
                onChange={(e) => setReminderReason(e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={onClose} variant="outlined">
              إلغاء
            </Button>
            <Button onClick={handleCreate} variant="contained" color="primary" disabled={!time}>
              جدولة
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

export function CallMeetingResultDialog({
  reminder,
  reminderType = "CALL",
  canManage,
  onUpdated,
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("DONE");
  const [result, setResult] = useState("");
  const { setLoading } = useToastContext();
  const name = LABEL[reminderType];

  if (!canManage) return null;

  async function handleUpdate() {
    const body = { status };
    if (reminderType === "MEETING") body.meetingResult = result;
    else body.callResult = result;
    const fn =
      reminderType === "MEETING"
        ? () => leadsService.updateMeeting(reminder.id, body)
        : () => leadsService.updateCall(reminder.id, body);
    const res = await runLeadMutation(fn, { setLoading, loading: "جاري التحديث..." });
    if (res) {
      onUpdated?.(res.data);
      setOpen(false);
      setResult("");
    }
  }

  return (
    <>
      <Button
        startIcon={<IoMdCall size={18} />}
        onClick={() => setOpen(true)}
        variant="outlined"
        size="small"
        sx={{ alignSelf: "flex-start" }}
      >
        تحديث نتيجة ال{name}
      </Button>
      {open && (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth dir="rtl">
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
            تحديث نتيجة ال{name}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} sx={{ width: "100%" }}>
              <MenuItem value="DONE">تم</MenuItem>
              <MenuItem value="MISSED">فائت</MenuItem>
            </Select>
            {status === "DONE" && (
              <TextField
                autoFocus
                margin="dense"
                label="النتيجة"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={result}
                onChange={(e) => setResult(e.target.value)}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={() => setOpen(false)} variant="outlined">
              إلغاء
            </Button>
            <Button
              onClick={handleUpdate}
              variant="contained"
              color="primary"
              disabled={!result.trim() && status === "DONE"}
            >
              تحديث
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

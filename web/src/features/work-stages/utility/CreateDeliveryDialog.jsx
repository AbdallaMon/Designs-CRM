"use client";

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { MobileDatePicker } from "@mui/x-date-pickers";

import { FiCalendar } from "react-icons/fi";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useAuth } from "@/app/providers/AuthProvider";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { DUBAI_TZ, toMiddayUTC } from "@/features/work-stages/utility/ProjectDeliverySchedule.jsx";

function CreateDeliveryDialog({ projectId, open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [days, setDays] = useState(1);
  const [value, setValue] = useState(dayjs().add(1, "day"));
  const { user } = useAuth();
  const { loading: submitting, setLoading: setSubmitting } = useToastContext();
  const { setAlertError } = useAlertContext();
  // TODO(profiles): no admin-tier delivery code; FE-only admin gate kept
  const admin = checkIfAdmin(user);

  useEffect(() => {
    const n = Number(days);
    setValue(dayjs().add(isNaN(n) ? 0 : n, "day"));
  }, [days]);

  const handleSubmit = async () => {
    if (!value) {
      setAlertError("Please select a delivery date.");
      return;
    }
    const deliveryAtUtc = toMiddayUTC(value, DUBAI_TZ); // 12:00 in Dubai -> UTC Date

    const req = await handleRequestSubmit(
      { projectId, deliveryAt: deliveryAtUtc, name }, // ← send name too
      setSubmitting,
      `delivery/`,
      false,
      "Adding"
    );
    if (req.status === 200) {
      onClose();
      await onCreate();
    }
  };
  if (!admin) return null;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <FiCalendar />
          <span>New Delivery Time</span>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {/* 1) Name */}
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
          />

          {/* 2) Days from today -> live preview */}
          <TextField
            label="Days from today"
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            fullWidth
            size="small"
            inputProps={{ min: 0, step: 1 }}
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <MobileDatePicker
              label="Delivery at (preview)"
              value={value}
              readOnly
              disabled
              slotProps={{
                textField: { fullWidth: true, size: "small" },
              }}
            />
          </LocalizationProvider>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!value || submitting}
          variant="contained"
        >
          {submitting ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateDeliveryDialog;

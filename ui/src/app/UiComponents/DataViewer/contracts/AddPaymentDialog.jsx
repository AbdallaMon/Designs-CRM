// components/payments/AddPaymentDialog.js
"use client";
import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import { FaMoneyBill } from "react-icons/fa";
import { PROJECT_TYPES, PROJECT_STATUSES } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

export default function AddPaymentDialog({
  open,
  onClose,
  contractId,
  onCreated,
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [projectType, setProjectType] = useState("");
  const [condition, setCondition] = useState("");
  const [error, setError] = useState("");
  const { setLoading } = useToastContext();
  const conditionsForType = useMemo(
    () => (projectType ? PROJECT_STATUSES[projectType] || [] : []),
    [projectType]
  );

  const valid = useMemo(() => {
    const amt = Number(amount);
    return amt > 0 && projectType && condition;
  }, [amount, projectType, condition]);

  const reset = () => {
    setAmount("");
    setNote("");
    setProjectType("");
    setCondition("");
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    if (!valid) return;

    const payload = {
      amount: Number(amount),
      note: note || undefined,
      projectType,
      paymentCondition: condition,
    };
    const req = await handleRequestSubmit(
      payload,
      setLoading,
      `shared/contracts/${contractId}/payments`,
      false,
      "Updating"
    );

    if (req.status === 200) {
      reset();
      onClose();
      if (onCreated) onCreated();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <FaMoneyBill />
          Add Payment
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {!!error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            required
            autoFocus
            size="small"
            inputProps={{ min: 0, step: "0.01" }}
          />

          <FormControl fullWidth size="small" required>
            <InputLabel>Project Type</InputLabel>
            <Select
              label="Project Type"
              value={projectType}
              onChange={(e) => {
                setProjectType(e.target.value);
                // reset condition if not in list anymore
                if (
                  !(PROJECT_STATUSES[e.target.value] || []).includes(condition)
                ) {
                  setCondition("");
                }
              }}
            >
              {(PROJECT_TYPES || []).map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" required disabled={!projectType}>
            <InputLabel>Payment Condition</InputLabel>
            <Select
              label="Payment Condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              {(conditionsForType || []).map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
            size="small"
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!valid}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

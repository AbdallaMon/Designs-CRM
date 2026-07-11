"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";

import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { MdAttachMoney, MdClose } from "react-icons/md";
import { useAlertContext } from "@/app/providers/MuiAlert";

const AdminCommissionForm = ({ userId, onUpdate }) => {
  const [open, setOpen] = useState(false);

  const [amount, setAmount] = useState("");
  const [commissionReason, setCommissionReason] = useState("");
  const [leadId, setLeadId] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAlertError } = useAlertContext();
  function handleOpen() {
    setOpen(true);
  }
  const handleSubmit = async () => {
    if (!amount || !leadId || !commissionReason.trim()) {
      setAlertError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const request = await handleRequestSubmit(
        { userId, leadId, amount, commissionReason },
        setLoading,
        "admin/commissions",
        false,
        "Creating"
      );

      if (request.status === 200) {
        if (onUpdate) {
          onUpdate(request.data);
        }
        handleClose();
      }
    } catch (error) {
      console.error("Error creating commission:", error);
      setAlertError(
        error.response?.data?.error || "Failed to create commission"
      );
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setCommissionReason("");
    setLeadId("");
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    setOpen(false);
  };
  if (!open) {
    return (
      <Button
        variant="contained"
        color="primary"
        startIcon={<MdAttachMoney />}
        onClick={handleOpen}
      >
        Create Commission
      </Button>
    );
  }
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Create Commission</Typography>
          <IconButton onClick={handleClose} size="small">
            <MdClose />
          </IconButton>
        </Box>
        <Alert
          severity="info"
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: 2,
            boxShadow: 1,
            fontSize: "1.1rem",
          }}
        >
          Please note this commission is something extra for the staff member
          and not a part of the lead main commission (5%).
        </Alert>
      </DialogTitle>

      <DialogContent>
        <Box mt={2}>
          <TextField
            label="Lead ID"
            fullWidth
            margin="normal"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            type="number"
            required
          />

          <TextField
            label="Amount"
            fullWidth
            margin="normal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            required
          />

          <TextField
            label="Commission Reason"
            fullWidth
            margin="normal"
            value={commissionReason}
            onChange={(e) => setCommissionReason(e.target.value)}
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Create Commission
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminCommissionForm;

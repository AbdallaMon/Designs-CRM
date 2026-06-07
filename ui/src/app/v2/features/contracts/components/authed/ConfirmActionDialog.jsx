"use client";

// Small confirm dialog for destructive/irreversible contract actions (cancel). Single-language
// Arabic. Calls onConfirm (async) then closes.

import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";

export default function ConfirmActionDialog({ open, onClose, onConfirm, title, description, confirmLabel = "تأكيد", color = "error" }) {
  const [busy, setBusy] = useState(false);
  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm?.();
    } finally {
      setBusy(false);
      onClose?.();
    }
  };
  return (
    <Dialog open={open} onClose={onClose} dir="rtl" maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ gap: 1, p: 2 }}>
        <Button onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button onClick={handleConfirm} color={color} variant="contained" disabled={busy}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Stack,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

export default function AddSpecialItemDialog({ open, onClose, onCreate }) {
  const [labelAr, setLabelAr] = useState("");
  const [labelEn, setLabelEn] = useState("");
  useEffect(() => {
    if (open) {
      setLabelAr("");
      setLabelEn("");
    }
  }, [open]);

  const canSave = !!labelAr.trim();

  const save = async () => {
    await onCreate({ labelAr: labelAr.trim(), labelEn: labelEn.trim() || "" });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600 }}>Add Special Item</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 2 }}>
          <TextField
            label="Item Name (Arabic) *"
            value={labelAr}
            onChange={(e) => setLabelAr(e.target.value)}
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Item Name (English) (Optional)"
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
            fullWidth
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={!canSave} variant="contained">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

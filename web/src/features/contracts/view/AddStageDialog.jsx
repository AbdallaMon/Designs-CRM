"use client";

import { useState } from "react";
import {
  Stack,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { CONTRACT_LEVELSENUM } from "@/app/helpers/constants";

export default function AddStageDialog({
  open,
  onClose,
  onAdd,
  usedTitles = [],
}) {
  const [level, setLevel] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [deptDeliveryDays, setDeptDeliveryDays] = useState("");
  const options = (CONTRACT_LEVELSENUM || [])
    .filter((o) => !usedTitles?.includes(o.enum))
    .map((o) => ({ value: o.enum, label: `${o.label} (${o.enum})` }));

  const canSave =
    level && Number(deliveryDays) > 0 && Number(deptDeliveryDays) > 0;

  const handleSave = () => {
    const picked = (CONTRACT_LEVELSENUM || []).find((x) => x.enum === level);
    onAdd({
      title: picked?.label,
      levelEnum: picked?.enum,
      deliveryDays: Number(deliveryDays),
      deptDeliveryDays: Number(deptDeliveryDays),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600 }}>Add Stage</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Level</InputLabel>
            <Select
              label="Level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {options.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="number"
            label="Delivery Days"
            value={deliveryDays}
            onChange={(e) => setDeliveryDays(e.target.value)}
            size="small"
          />
          <TextField
            type="number"
            label="Department Days"
            value={deptDeliveryDays}
            onChange={(e) => setDeptDeliveryDays(e.target.value)}
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!canSave} variant="contained">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
} from "@mui/material";
import { CHAT_ROOM_TYPES } from "../../config/chatConstants.js";

const GROUP_TYPE_OPTIONS = [
  { value: CHAT_ROOM_TYPES.GROUP, label: "مجموعة" },
  { value: CHAT_ROOM_TYPES.PROJECT_GROUP, label: "مجموعة مشروع" },
  { value: CHAT_ROOM_TYPES.MULTI_PROJECT, label: "متعدد المشاريع" },
];

/**
 * Create a group room. Submit builds the exact create payload and calls `createRoom`
 * (which posts /chat/rooms and toasts). Gated upstream by ROOM_CREATE.
 */
export function CreateGroupDialog({ open, onClose, createRoom, onCreated }) {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: { name: "", type: CHAT_ROOM_TYPES.GROUP },
  });
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      const room = await createRoom({ name: values.name, type: values.type });
      if (room) {
        onCreated?.(room);
        reset();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth sx={{ zIndex: 1302 }}>
      <DialogTitle>إنشاء مجموعة جديدة</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="name"
                control={control}
                rules={{ required: "الاسم مطلوب" }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="اسم المجموعة"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="النوع" fullWidth>
                    {GROUP_TYPE_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>إلغاء</Button>
          <Button type="submit" variant="contained" disabled={submitting}>إنشاء</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

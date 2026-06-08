"use client";

// <FixedDataDialog /> — create OR edit a fixed-data item (RHF dialog). CREATE body (.strict):
// { title, description? }; EDIT body (.strict, >=1 field): { title?, description? }. Submits via
// the SERVICE through runAdminResidualMutation (envelope CODE → Arabic toast). Gated at the CALL
// SITE on FIXED_DATA_MANAGE. The service `pick()`s the whitelist again. Arabic / RTL.

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { adminResidualService } from "../adminResidual.service.js";
import { runAdminResidualMutation } from "../adminResidual.mutations.js";

const DEFAULTS = { title: "", description: "" };

export function FixedDataDialog({ open, mode = "create", item, onClose, onSaved }) {
  const isEdit = mode === "edit";
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, reset } = useForm({ defaultValues: DEFAULTS });

  useEffect(() => {
    if (!open) return;
    reset(
      isEdit && item
        ? { title: item.title ?? "", description: item.description ?? "" }
        : DEFAULTS,
    );
  }, [open, isEdit, item, reset]);

  function close() {
    reset(DEFAULTS);
    onClose?.();
  }

  async function onSubmit(values) {
    const body = { title: values.title.trim() };
    const desc = values.description?.trim();
    if (desc) body.description = desc;
    const fn = isEdit
      ? () => adminResidualService.updateFixedData(item.id, body)
      : () => adminResidualService.createFixedData(body);
    const res = await runAdminResidualMutation(fn, {
      loading: isEdit ? "جاري تحديث البيان..." : "جاري إضافة البيان...",
      setLoading: setSubmitting,
    });
    if (res) {
      close();
      onSaved?.(res.data);
    }
  }

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth dir="rtl">
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
        {isEdit ? "تعديل بيان ثابت" : "إضافة بيان ثابت"}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Controller
              name="title"
              control={control}
              rules={{ required: "العنوان مطلوب" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="العنوان"
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="الوصف (اختياري)" fullWidth multiline minRows={2} />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={close} variant="outlined" disabled={submitting}>
            إلغاء
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={submitting}>
            {isEdit ? "حفظ" : "إضافة"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default FixedDataDialog;

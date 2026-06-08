"use client";

// <CreateProjectGroupModal /> — create a project group for a lead (RHF dialog). Builds the EXACT
// BE .strict() body { clientLeadId, title }. Submits via the SERVICE through
// runAdminResidualMutation (envelope CODE → Arabic toast). Gated at the CALL SITE on
// PROJECT_GROUP_CREATE (lead-scoped on body.clientLeadId by the BE). Arabic / RTL.

import { useState } from "react";
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

const DEFAULTS = { clientLeadId: "", title: "" };

export function CreateProjectGroupModal({ open, defaultLeadId, onClose, onCreated }) {
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: { ...DEFAULTS, clientLeadId: defaultLeadId ? String(defaultLeadId) : "" },
  });

  function close() {
    reset(DEFAULTS);
    onClose?.();
  }

  async function onSubmit(values) {
    const res = await runAdminResidualMutation(
      () =>
        adminResidualService.createProjectGroup({
          clientLeadId: Number(values.clientLeadId),
          title: values.title.trim(),
        }),
      { loading: "جاري إنشاء مجموعة المشاريع...", setLoading: setSubmitting },
    );
    if (res) {
      close();
      onCreated?.(res.data);
    }
  }

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth dir="rtl">
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>إنشاء مجموعة مشاريع</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Controller
              name="clientLeadId"
              control={control}
              rules={{ required: "معرّف العميل المحتمل مطلوب" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="معرّف العميل المحتمل"
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="title"
              control={control}
              rules={{ required: "عنوان المجموعة مطلوب" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="عنوان المجموعة"
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={close} variant="outlined" disabled={submitting}>
            إلغاء
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={submitting}>
            إنشاء
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CreateProjectGroupModal;

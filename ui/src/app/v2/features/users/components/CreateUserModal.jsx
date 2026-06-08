"use client";

// Create-user modal — react-hook-form (Controller + MUI fields) building the EXACT BE body
// the create endpoint accepts: { email, password, name, role, telegramUsername? }. Submits via
// usersService.createUser through runUsersMutation (envelope CODE → Arabic toast); on success it
// closes + refetches the list. Gated at the CALL SITE on PERMISSIONS.USER.CREATE (the page does
// not render this when the user cannot create). The server still enforces. Single-language
// Arabic / RTL. Mirrors the accounting RHF dialog pattern (SalaryDialog.jsx).

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { usersService } from "../users.service.js";
import { runUsersMutation } from "../users.mutations.js";
import { USER_ROLE_OPTIONS } from "../config/usersConstants.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULTS = { name: "", email: "", password: "", role: "", telegramUsername: "" };

export function CreateUserModal({ open, onClose, onCreated }) {
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, reset } = useForm({ defaultValues: DEFAULTS });

  function close() {
    reset(DEFAULTS);
    onClose?.();
  }

  async function onSubmit(values) {
    // Whitelist the EXACT BE body — never forward the raw form object.
    const body = {
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      role: values.role,
    };
    const tg = values.telegramUsername?.trim();
    if (tg) body.telegramUsername = tg;

    const res = await runUsersMutation(() => usersService.createUser(body), {
      loading: "جاري إنشاء المستخدم...",
      setLoading: setSubmitting,
    });
    if (res) {
      reset(DEFAULTS);
      onCreated?.(res.data);
      onClose?.();
    }
  }

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth dir="rtl">
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>إنشاء مستخدم</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Controller
              name="name"
              control={control}
              rules={{ required: "الاسم مطلوب" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="الاسم"
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              rules={{
                required: "البريد الإلكتروني مطلوب",
                pattern: { value: EMAIL_RE, message: "صيغة البريد الإلكتروني غير صحيحة" },
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="email"
                  label="البريد الإلكتروني"
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              rules={{
                required: "كلمة المرور مطلوبة",
                minLength: { value: 6, message: "كلمة المرور 6 أحرف على الأقل" },
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="password"
                  label="كلمة المرور"
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="role"
              control={control}
              rules={{ required: "الدور مطلوب" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  label="الدور"
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                >
                  {USER_ROLE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="telegramUsername"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="معرّف تيليجرام (اختياري)"
                  fullWidth
                  placeholder="@username"
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

export default CreateUserModal;

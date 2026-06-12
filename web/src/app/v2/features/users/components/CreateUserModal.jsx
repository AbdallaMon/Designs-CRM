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
import { useT } from "@/app/v2/lib/i18n";
import { usersService } from "../users.service.js";
import { runUsersMutation } from "../users.mutations.js";
import { USER_ROLE_OPTIONS } from "../config/usersConstants.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULTS = { name: "", email: "", password: "", role: "", telegramUsername: "" };

export function CreateUserModal({ open, onClose, onCreated }) {
  const { t } = useT();
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
      loading: t("users.create.loading"),
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
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>{t("users.create.title")}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Controller
              name="name"
              control={control}
              rules={{ required: t("users.create.validation.nameRequired") }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label={t("users.create.field.name")}
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
                required: t("users.create.validation.emailRequired"),
                pattern: { value: EMAIL_RE, message: t("users.create.validation.emailInvalid") },
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="email"
                  label={t("users.create.field.email")}
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
                required: t("users.create.validation.passwordRequired"),
                minLength: { value: 6, message: t("users.create.validation.passwordMin") },
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="password"
                  label={t("users.create.field.password")}
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="role"
              control={control}
              rules={{ required: t("users.create.validation.roleRequired") }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  label={t("users.create.field.role")}
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
                  label={t("users.create.field.telegram")}
                  fullWidth
                  placeholder="@username"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={close} variant="outlined" disabled={submitting}>
            {t("users.create.cancel")}
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={submitting}>
            {t("users.create.submit")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CreateUserModal;

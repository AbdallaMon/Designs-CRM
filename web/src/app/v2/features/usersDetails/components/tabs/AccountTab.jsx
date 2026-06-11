"use client";

// Account tab — admin edit of the core user record (PUT /:userId, body
// { email?, password?, name?, role?, telegramUsername? }) + ban/unban (PATCH /:userId, body
// { user:{ isActive } } via changeStatus). Edit gated on PERMISSIONS.USER.UPDATE AND the row
// capability `canEditUser`; the status toggle on USER.UPDATE AND `canToggleStatus` (the BE
// folds not-self into it — you cannot ban yourself). Body whitelisted here (only changed
// fields are sent; password only when typed). Single-language Arabic / RTL.

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { SectionCard } from "@/app/v2/shared/components";
import { usersService } from "@/app/v2/features/users/users.service.js";
import { runUsersMutation } from "@/app/v2/features/users/users.mutations.js";
import { USER_ROLE_OPTIONS } from "@/app/v2/features/users/config/usersConstants.js";
import { UserStatusChip } from "@/app/v2/features/users/components/UserStatusChip.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AccountTab({ user, capabilities, onUpdated }) {
  const { hasPermission } = usePermission();
  const caps = capabilities ?? {};
  const canEdit = hasPermission(PERMISSIONS.USER.UPDATE) && Boolean(caps.canEditUser);
  const canToggle = hasPermission(PERMISSIONS.USER.UPDATE) && Boolean(caps.canToggleStatus);

  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      role: user?.role ?? "",
      telegramUsername: user?.telegramUsername ?? "",
      password: "",
    },
  });

  useEffect(() => {
    reset({
      name: user?.name ?? "",
      email: user?.email ?? "",
      role: user?.role ?? "",
      telegramUsername: user?.telegramUsername ?? "",
      password: "",
    });
  }, [user, reset]);

  async function onSubmit(values) {
    // Whitelist + only send changed fields; password only when the admin typed one.
    const body = {};
    if (values.name?.trim() && values.name.trim() !== user?.name) body.name = values.name.trim();
    if (values.email?.trim() && values.email.trim() !== user?.email) body.email = values.email.trim();
    if (values.role && values.role !== user?.role) body.role = values.role;
    const tg = values.telegramUsername?.trim();
    if (tg !== (user?.telegramUsername ?? "")) body.telegramUsername = tg;
    if (values.password) body.password = values.password;

    if (Object.keys(body).length === 0) return;
    const res = await runUsersMutation(() => usersService.updateUser(user.id, body), {
      loading: "جاري حفظ الحساب...",
      setLoading: setSubmitting,
    });
    if (res) onUpdated?.(res.data);
  }

  // CONTRACT NOTE: the BE repo TOGGLES the passed flag, so we send the CURRENT isActive.
  async function toggleStatus() {
    const res = await runUsersMutation(
      () => usersService.changeStatus(user.id, user.isActive),
      { loading: user.isActive ? "جاري الإيقاف..." : "جاري التفعيل...", setLoading: setToggling },
    );
    if (res) onUpdated?.(res.data);
  }

  return (
    <Stack spacing={2}>
      <SectionCard title="حالة الحساب">
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <UserStatusChip isActive={Boolean(user?.isActive)} size="medium" />
          {canToggle ? (
            <Button
              variant="outlined"
              color={user?.isActive ? "error" : "success"}
              onClick={toggleStatus}
              disabled={toggling}
            >
              {user?.isActive ? "إيقاف المستخدم" : "تفعيل المستخدم"}
            </Button>
          ) : (
            <Typography variant="body2" color="text.secondary">
              لا يمكنك تغيير حالة هذا الحساب.
            </Typography>
          )}
        </Stack>
      </SectionCard>

      <SectionCard title="بيانات الحساب">
        {canEdit ? (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2.5}>
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
                rules={{ pattern: { value: EMAIL_RE, message: "صيغة البريد الإلكتروني غير صحيحة" } }}
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
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="الدور" fullWidth>
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
                  <TextField {...field} label="معرّف تيليجرام (اختياري)" fullWidth placeholder="@username" />
                )}
              />
              <Controller
                name="password"
                control={control}
                rules={{
                  validate: (v) => !v || v.length >= 6 || "كلمة المرور 6 أحرف على الأقل",
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="password"
                    label="كلمة مرور جديدة (اتركها فارغة لعدم التغيير)"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Box>
                <Button type="submit" variant="contained" color="primary" disabled={submitting}>
                  حفظ
                </Button>
              </Box>
            </Stack>
          </form>
        ) : (
          <Typography variant="body2" color="text.secondary">
            لا تملك صلاحية تعديل هذا الحساب.
          </Typography>
        )}
      </SectionCard>
    </Stack>
  );
}

export default AccountTab;

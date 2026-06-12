"use client";

// Profile tab — view + edit the user's profile (GET/PUT /:userId/profile, object-scope-checked
// self-OR-admin on the BE). Read shows the safe profile; edit is gated on
// PERMISSIONS.USER.PROFILE_EDIT AND the record capability `canEditProfile` (the BE folds
// self-or-admin into it). The self-editable whitelist on the BE is { name, telegramUsername,
// profilePicture } — we expose name + telegram (picture is upload-based, out of this pass).
// Body is whitelisted here too (never forward the raw form). Single-language Arabic / RTL.

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Box, Button, Grid, Stack, TextField, Typography } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useT } from "@/app/v2/lib/i18n";
import { SectionCard } from "@/app/v2/shared/components";
import { usersService } from "@/app/v2/features/users/users.service.js";
import { runUsersMutation } from "@/app/v2/features/users/users.mutations.js";
import { resolveRoleLabel } from "@/app/v2/features/users/config/usersConstants.js";

export function ProfileTab({ profile, onUpdated }) {
  const { hasPermission } = usePermission();
  const { t } = useT();
  const canEdit =
    hasPermission(PERMISSIONS.USER.PROFILE_EDIT) && Boolean(profile?.capabilities?.canEditProfile);

  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: { name: profile?.name ?? "", telegramUsername: profile?.telegramUsername ?? "" },
  });

  useEffect(() => {
    reset({ name: profile?.name ?? "", telegramUsername: profile?.telegramUsername ?? "" });
  }, [profile, reset]);

  async function onSubmit(values) {
    // Whitelist the self-editable fields (BE drops the rest, but never forward the raw object).
    const body = { name: values.name.trim() };
    const tg = values.telegramUsername?.trim();
    if (tg) body.telegramUsername = tg;
    const res = await runUsersMutation(() => usersService.updateProfile(profile.id, body), {
      loading: t("usersDetails.profile.loading"),
      setLoading: setSubmitting,
    });
    if (res) onUpdated?.(res.data);
  }

  return (
    <Stack spacing={2}>
      <SectionCard title={t("usersDetails.profile.viewTitle")}>
        <Grid container spacing={2}>
          <ReadField label={t("usersDetails.profile.field.name")} value={profile?.name} />
          <ReadField label={t("usersDetails.profile.field.email")} value={profile?.email} />
          <ReadField label={t("usersDetails.profile.field.role")} value={resolveRoleLabel(profile?.role)} />
          <ReadField label={t("usersDetails.profile.field.telegram")} value={profile?.telegramUsername} />
        </Grid>
      </SectionCard>

      {canEdit && (
        <SectionCard title={t("usersDetails.profile.editTitle")}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2.5}>
              <Controller
                name="name"
                control={control}
                rules={{ required: t("usersDetails.profile.validation.nameRequired") }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label={t("usersDetails.profile.field.name")}
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="telegramUsername"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label={t("usersDetails.profile.field.telegramOptional")} fullWidth placeholder="@username" />
                )}
              />
              <Box>
                <Button type="submit" variant="contained" color="primary" disabled={submitting}>
                  {t("usersDetails.profile.save")}
                </Button>
              </Box>
            </Stack>
          </form>
        </SectionCard>
      )}
    </Stack>
  );
}

function ReadField({ label, value }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ textAlign: "start" }}>
        {value || "—"}
      </Typography>
    </Grid>
  );
}

export default ProfileTab;

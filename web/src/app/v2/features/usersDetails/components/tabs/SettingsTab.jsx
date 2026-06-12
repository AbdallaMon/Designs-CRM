"use client";

// Settings tab — groups the smaller admin user-management controls, EACH block gated on its
// OWN permission code AND the matching record capability (a block renders only when allowed):
//   • Restricted countries  → POST /:userId/restricted-countries { countries }   [manage_restricted_countries / canManageRestrictedCountries]
//   • Max leads / per-day    → PUT /max-leads(/-per-day)/:userId                  [set_max_leads / canSetMaxLeads]
//   • Staff-extra flags      → PATCH /:userId/staff-extra { isPrimary?, isSuperSales? } [manage_staff_extra / canManageStaffExtra]
// The staff-extra body is a BE .strict() schema — the service `pick`s ONLY the two flags; we
// send only the flag that changed. Restricted countries are fetched lazily (free-form string
// list — Autocomplete freeSolo chips). All five states where a read is involved. Arabic / RTL.

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useT } from "@/app/v2/lib/i18n";
import {
  SectionCard,
  LoadingState,
  ErrorState,
  PartialPermissionState,
} from "@/app/v2/shared/components";
import { usersService } from "@/app/v2/features/users/users.service.js";
import { runUsersMutation } from "@/app/v2/features/users/users.mutations.js";
import { usersMessages } from "@/app/v2/features/users/config/usersMessages.js";
import { useLazyResource } from "../../hooks/useLazyResource.js";

const P = PERMISSIONS.USER;

export function SettingsTab({ profile, capabilities, userId, onUpdated }) {
  const { hasPermission } = usePermission();
  const { t } = useT();
  const caps = capabilities ?? {};
  const canCountries =
    hasPermission(P.MANAGE_RESTRICTED_COUNTRIES) && Boolean(caps.canManageRestrictedCountries);
  const canMaxLeads = hasPermission(P.SET_MAX_LEADS) && Boolean(caps.canSetMaxLeads);
  const canStaffExtra = hasPermission(P.MANAGE_STAFF_EXTRA) && Boolean(caps.canManageStaffExtra);

  const noneAllowed = !canCountries && !canMaxLeads && !canStaffExtra;
  if (noneAllowed) {
    return (
      <PartialPermissionState
        denied
        title={t("usersDetails.settings.deniedTitle")}
        message={t("usersDetails.settings.deniedMessage")}
      />
    );
  }

  return (
    <Stack spacing={2}>
      {canCountries && <RestrictedCountriesBlock userId={userId} />}
      {canMaxLeads && <MaxLeadsBlock profile={profile} userId={userId} onUpdated={onUpdated} />}
      {canStaffExtra && (
        <StaffExtraBlock profile={profile} userId={userId} onUpdated={onUpdated} />
      )}
    </Stack>
  );
}

// ── Restricted countries (lazy read) ────────────────────────────────────────────────
function RestrictedCountriesBlock({ userId }) {
  const { t } = useT();
  const { data, isLoading, error, refetch } = useLazyResource(
    () => usersService.getRestrictedCountries(userId),
    { deps: [userId] },
  );
  const [countries, setCountries] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCountries(Array.isArray(data) ? data : []);
  }, [data]);

  async function save() {
    const res = await runUsersMutation(
      () => usersService.updateRestrictedCountries(userId, { countries }),
      { loading: t("usersDetails.settings.countries.loading"), setLoading: setSubmitting },
    );
    if (res) refetch();
  }

  return (
    <SectionCard
      title={t("usersDetails.settings.countries.title")}
      subtitle={t("usersDetails.settings.countries.subtitle")}
      actions={
        <Button variant="contained" onClick={save} disabled={submitting || isLoading}>
          {t("usersDetails.settings.countries.save")}
        </Button>
      }
    >
      {error ? (
        <ErrorState error={error} onRetry={refetch} resolver={usersMessages} />
      ) : isLoading ? (
        <LoadingState variant="form" fields={1} />
      ) : (
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={countries}
          onChange={(_e, val) => setCountries(val)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("usersDetails.settings.countries.field")}
              placeholder={t("usersDetails.settings.countries.placeholder")}
            />
          )}
        />
      )}
    </SectionCard>
  );
}

// ── Max leads / per-day ─────────────────────────────────────────────────────────────
function MaxLeadsBlock({ profile, userId, onUpdated }) {
  const { t } = useT();
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      maxLeadsCounts: profile?.maxLeadsCounts ?? "",
      maxLeadCountPerDay: profile?.maxLeadCountPerDay ?? "",
    },
  });

  useEffect(() => {
    reset({
      maxLeadsCounts: profile?.maxLeadsCounts ?? "",
      maxLeadCountPerDay: profile?.maxLeadCountPerDay ?? "",
    });
  }, [profile, reset]);

  async function onSubmit(values) {
    // Two distinct endpoints; call only the one(s) that changed.
    let ok = false;
    if (String(values.maxLeadsCounts) !== String(profile?.maxLeadsCounts ?? "")) {
      const r = await runUsersMutation(
        () => usersService.setMaxLeads(userId, Number(values.maxLeadsCounts)),
        { loading: t("usersDetails.settings.maxLeads.loading"), setLoading: setSubmitting },
      );
      ok = ok || Boolean(r);
    }
    if (String(values.maxLeadCountPerDay) !== String(profile?.maxLeadCountPerDay ?? "")) {
      const r = await runUsersMutation(
        () => usersService.setMaxLeadsPerDay(userId, Number(values.maxLeadCountPerDay)),
        { loading: t("usersDetails.settings.maxLeadsPerDay.loading"), setLoading: setSubmitting },
      );
      ok = ok || Boolean(r);
    }
    if (ok) onUpdated?.();
  }

  return (
    <SectionCard title={t("usersDetails.settings.maxLeads.title")}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <Controller
            name="maxLeadsCounts"
            control={control}
            rules={{ validate: (v) => v === "" || Number(v) >= 0 || t("usersDetails.settings.maxLeads.validation.nonNegative") }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label={t("usersDetails.settings.maxLeads.field.max")}
                fullWidth
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="maxLeadCountPerDay"
            control={control}
            rules={{ validate: (v) => v === "" || Number(v) >= 0 || t("usersDetails.settings.maxLeads.validation.nonNegative") }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label={t("usersDetails.settings.maxLeads.field.perDay")}
                fullWidth
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Box>
            <Button type="submit" variant="contained" disabled={submitting}>
              {t("usersDetails.settings.maxLeads.save")}
            </Button>
          </Box>
        </Stack>
      </form>
    </SectionCard>
  );
}

// ── Staff-extra flags (BE .strict(): only the two flags) ─────────────────────────────
function StaffExtraBlock({ profile, userId, onUpdated }) {
  const { t } = useT();
  const [isPrimary, setIsPrimary] = useState(Boolean(profile?.isPrimary));
  const [isSuperSales, setIsSuperSales] = useState(Boolean(profile?.isSuperSales));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setIsPrimary(Boolean(profile?.isPrimary));
    setIsSuperSales(Boolean(profile?.isSuperSales));
  }, [profile]);

  const dirty =
    isPrimary !== Boolean(profile?.isPrimary) || isSuperSales !== Boolean(profile?.isSuperSales);

  async function save() {
    // Send ONLY the flag(s) that changed; the service already pick()s to {isPrimary?,isSuperSales?}.
    const flags = {};
    if (isPrimary !== Boolean(profile?.isPrimary)) flags.isPrimary = isPrimary;
    if (isSuperSales !== Boolean(profile?.isSuperSales)) flags.isSuperSales = isSuperSales;
    const res = await runUsersMutation(() => usersService.setStaffExtra(userId, flags), {
      loading: t("usersDetails.settings.staffExtra.loading"),
      setLoading: setSubmitting,
    });
    if (res) onUpdated?.();
  }

  return (
    <SectionCard
      title={t("usersDetails.settings.staffExtra.title")}
      subtitle={t("usersDetails.settings.staffExtra.subtitle")}
      actions={
        <Button variant="contained" onClick={save} disabled={!dirty || submitting}>
          {t("usersDetails.settings.staffExtra.save")}
        </Button>
      }
    >
      <Stack>
        <FormControlLabel
          control={<Switch checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />}
          label={t("usersDetails.settings.staffExtra.isPrimary")}
        />
        <FormControlLabel
          control={
            <Switch checked={isSuperSales} onChange={(e) => setIsSuperSales(e.target.checked)} />
          }
          label={t("usersDetails.settings.staffExtra.isSuperSales")}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("usersDetails.settings.staffExtra.note")}
        </Typography>
      </Stack>
    </SectionCard>
  );
}

export default SettingsTab;

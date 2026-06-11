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
        title="إعدادات المستخدم غير متاحة لصلاحياتك"
        message="لا تملك صلاحية تعديل إعدادات هذا المستخدم."
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
      { loading: "جاري حفظ الدول المقيدة...", setLoading: setSubmitting },
    );
    if (res) refetch();
  }

  return (
    <SectionCard
      title="الدول المقيّدة"
      subtitle="الدول التي لا تُسنَد منها عملاء لهذا المستخدم."
      actions={
        <Button variant="contained" onClick={save} disabled={submitting || isLoading}>
          حفظ
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
            <TextField {...params} label="الدول" placeholder="أضف دولة ثم اضغط Enter" />
          )}
        />
      )}
    </SectionCard>
  );
}

// ── Max leads / per-day ─────────────────────────────────────────────────────────────
function MaxLeadsBlock({ profile, userId, onUpdated }) {
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
        { loading: "جاري تحديث الحد الأقصى...", setLoading: setSubmitting },
      );
      ok = ok || Boolean(r);
    }
    if (String(values.maxLeadCountPerDay) !== String(profile?.maxLeadCountPerDay ?? "")) {
      const r = await runUsersMutation(
        () => usersService.setMaxLeadsPerDay(userId, Number(values.maxLeadCountPerDay)),
        { loading: "جاري تحديث الحد اليومي...", setLoading: setSubmitting },
      );
      ok = ok || Boolean(r);
    }
    if (ok) onUpdated?.();
  }

  return (
    <SectionCard title="حدود العملاء">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <Controller
            name="maxLeadsCounts"
            control={control}
            rules={{ validate: (v) => v === "" || Number(v) >= 0 || "رقم غير سالب" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label="الحد الأقصى للعملاء"
                fullWidth
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="maxLeadCountPerDay"
            control={control}
            rules={{ validate: (v) => v === "" || Number(v) >= 0 || "رقم غير سالب" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label="الحد الأقصى اليومي للعملاء"
                fullWidth
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Box>
            <Button type="submit" variant="contained" disabled={submitting}>
              حفظ
            </Button>
          </Box>
        </Stack>
      </form>
    </SectionCard>
  );
}

// ── Staff-extra flags (BE .strict(): only the two flags) ─────────────────────────────
function StaffExtraBlock({ profile, userId, onUpdated }) {
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
      loading: "جاري تحديث بيانات الموظف...",
      setLoading: setSubmitting,
    });
    if (res) onUpdated?.();
  }

  return (
    <SectionCard
      title="إعدادات الموظف"
      subtitle="صلاحيات إضافية لموظفي المبيعات."
      actions={
        <Button variant="contained" onClick={save} disabled={!dirty || submitting}>
          حفظ
        </Button>
      }
    >
      <Stack>
        <FormControlLabel
          control={<Switch checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />}
          label="موظف أساسي"
        />
        <FormControlLabel
          control={
            <Switch checked={isSuperSales} onChange={(e) => setIsSuperSales(e.target.checked)} />
          }
          label="مبيعات أول"
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          تُطبَّق هذه الإعدادات على موظفي المبيعات فقط؛ يتحقق الخادم من ذلك.
        </Typography>
      </Stack>
    </SectionCard>
  );
}

export default SettingsTab;

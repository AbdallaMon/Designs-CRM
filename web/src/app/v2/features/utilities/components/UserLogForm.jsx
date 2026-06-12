"use client";

// <UserLogForm /> — the daily user-log surface (UX plan §3.9). On mount it asks the BE whether
// TODAY's log already exists (checkUserLog, self-scoped — no userId), then either shows a
// read-only "already logged" confirmation or an editable form (date / description / minutes).
// Submit (submitUserLog) is gated at the CALL SITE on PERMISSIONS.UTILITY.USER_LOG_SUBMIT; the
// page passes `canSubmit`. Data flows ONLY through utilitiesService + runUtilitiesMutation
// (envelope CODE → Arabic toast). All five states wired. Single-language Arabic / RTL.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Stack, TextField, Button, Box } from "@mui/material";
import { MdCheckCircle } from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n";
import { SectionCard } from "@/app/v2/shared/components";
import { LoadingState } from "@/app/v2/shared/components";
import { ErrorState } from "@/app/v2/shared/components";
import { SuccessState } from "@/app/v2/shared/components";
import { PartialPermissionState } from "@/app/v2/shared/components";
import { utilitiesService } from "../utilities.service.js";
import { runUtilitiesMutation } from "../utilities.mutations.js";
import { utilitiesMessages } from "../config/utilitiesMessages.js";

// Local YYYY-MM-DD for today (the <input type="date"> value + the submit `date`).
function todayISODate() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

// Today's [startTime, endTime] window for the self-scoped existence check.
function todayWindow() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { startTime: start.toISOString(), endTime: end.toISOString() };
}

// The check returns the envelope; today's log "exists" when data is a non-empty object/array.
function logExists(data) {
  if (!data) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === "object") return Object.keys(data).length > 0;
  return Boolean(data);
}

export function UserLogForm({ canSubmit = false }) {
  const { t } = useT();
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState(null);
  const [existing, setExisting] = useState(false); // today's log already submitted?
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const defaults = useMemo(
    () => ({ date: todayISODate(), description: "", totalMinutes: "" }),
    [],
  );
  const { control, handleSubmit, reset } = useForm({ defaultValues: defaults });

  const check = useCallback(async () => {
    setChecking(true);
    setCheckError(null);
    try {
      const res = await utilitiesService.checkUserLog(todayWindow());
      setExisting(logExists(res?.data));
    } catch (err) {
      setCheckError(err?.data?.message || err?.message || "USER_LOG_CHECK_FAILED");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  async function onSubmit(values) {
    // Whitelist the EXACT BE body (.strict()): { date, description, totalMinutes? }. No userId.
    const body = {
      date: values.date,
      description: values.description.trim(),
    };
    const minutes = String(values.totalMinutes ?? "").trim();
    if (minutes !== "") body.totalMinutes = Number(minutes);

    const res = await runUtilitiesMutation(() => utilitiesService.submitUserLog(body), {
      loading: t("utilities.userLog.loadingToast"),
      setLoading: setSubmitting,
    });
    if (res) {
      reset(defaults);
      setExisting(true);
      setJustSubmitted(true);
    }
  }

  if (checking) {
    return (
      <SectionCard title={t("utilities.userLog.title")}>
        <LoadingState variant="form" fields={3} />
      </SectionCard>
    );
  }

  if (checkError) {
    return (
      <SectionCard title={t("utilities.userLog.title")}>
        <ErrorState error={checkError} onRetry={check} resolver={utilitiesMessages} />
      </SectionCard>
    );
  }

  if (justSubmitted) {
    return (
      <SuccessState
        title={t("utilities.userLog.success.title")}
        message={t("utilities.userLog.success.message")}
      />
    );
  }

  if (existing) {
    return (
      <SectionCard title={t("utilities.userLog.title")}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 1 }}>
          <Box sx={{ color: "success.main", display: "flex", fontSize: 28 }}>
            <MdCheckCircle />
          </Box>
          <Box>
            <Box sx={{ fontWeight: 600 }}>{t("utilities.userLog.existing.title")}</Box>
            <Box sx={{ color: "text.secondary", fontSize: 14 }}>
              {t("utilities.userLog.existing.message")}
            </Box>
          </Box>
        </Stack>
      </SectionCard>
    );
  }

  // No log yet today → show the form (or a calm partial-permission notice if the role can VIEW
  // today's state but cannot SUBMIT).
  if (!canSubmit) {
    return (
      <SectionCard title={t("utilities.userLog.title")}>
        <PartialPermissionState
          title={t("utilities.userLog.partial.title")}
          message={t("utilities.userLog.partial.message")}
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={t("utilities.userLog.title")}
      subtitle={t("utilities.userLog.subtitle")}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <Controller
            name="date"
            control={control}
            rules={{ required: t("utilities.userLog.field.date.required") }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="date"
                label={t("utilities.userLog.field.date")}
                fullWidth
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            rules={{ required: t("utilities.userLog.field.description.required") }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label={t("utilities.userLog.field.description")}
                placeholder={t("utilities.userLog.field.description.placeholder")}
                fullWidth
                multiline
                minRows={3}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="totalMinutes"
            control={control}
            rules={{
              validate: (v) => {
                const s = String(v ?? "").trim();
                if (s === "") return true;
                const n = Number(s);
                return (
                  (Number.isInteger(n) && n >= 0) ||
                  t("utilities.userLog.field.minutes.invalid")
                );
              },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label={t("utilities.userLog.field.minutes")}
                fullWidth
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
              />
            )}
          />
          <Box>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {t("utilities.userLog.submit")}
            </Button>
          </Box>
        </Stack>
      </form>
    </SectionCard>
  );
}

export default UserLogForm;

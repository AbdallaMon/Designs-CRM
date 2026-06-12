"use client";

// Self work-log tab. The /v2/utilities/user-logs surface is SELF-SCOPED (no userId): the
// subject is always the authenticated caller (BE IDOR fix). It supports exactly two ops:
//   • GET  ?startTime=&endTime=  → BOOLEAN: do I already have a log in this range?
//   • POST { date, description, totalMinutes? } → submit MY work log
// This is NOT an admin "log viewer" (that lives in the users module, USER.VIEW_LOGS) — the
// utilities surface only exposes the self check + self submit, so this tab is a personal
// work-log entry/check screen. Reads go through useRequest-style service calls; the submit
// goes through the utilities mutation runner (toast resolving the BE CODE → Arabic).
// Single-language Arabic RTL.

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FiCheckCircle, FiSearch, FiSend, FiXCircle } from "react-icons/fi";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { utilitiesService } from "../utilities.service.js";
import { runUtilitiesMutation } from "../utilities.mutations.js";

// Read the boolean exists-flag out of the envelope defensively.
function readExists(res) {
  const d = res?.data;
  if (typeof d === "boolean") return d;
  return Boolean(d?.exists ?? d);
}

export default function UserLogTab() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.UTILITY.USER_LOG_VIEW);
  const canSubmit = hasPermission(PERMISSIONS.UTILITY.USER_LOG_SUBMIT);

  // ── check section (GET user-logs) ───────────────────────────────────────
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null); // null | true | false
  const [checkError, setCheckError] = useState(null);

  const canCheck = Boolean(startTime && endTime) && !checking;

  const runCheck = async () => {
    if (!canCheck) return;
    setChecking(true);
    setCheckError(null);
    setCheckResult(null);
    try {
      const res = await utilitiesService.checkUserLog({ startTime, endTime });
      setCheckResult(readExists(res));
    } catch (err) {
      setCheckError(err?.data?.message || err?.message || "تعذّر التحقق من السجل");
    } finally {
      setChecking(false);
    }
  };

  // ── submit section (POST user-logs) ─────────────────────────────────────
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [totalMinutes, setTotalMinutes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canDoSubmit =
    Boolean(date && description.trim()) && !submitting && canSubmit;

  const runSubmit = async () => {
    if (!canDoSubmit) return;
    const payload = {
      date,
      description: description.trim(),
    };
    const minutes = parseInt(totalMinutes, 10);
    if (Number.isFinite(minutes) && minutes >= 0) payload.totalMinutes = minutes;

    const res = await runUtilitiesMutation(
      () => utilitiesService.submitUserLog(payload),
      { loading: "جاري تسجيل سجل العمل...", setLoading: setSubmitting },
    );
    if (res) {
      setDate("");
      setDescription("");
      setTotalMinutes("");
    }
  };

  if (!canView && !canSubmit) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography color="text.secondary">
          لا تملك صلاحية الوصول إلى سجل العمل.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" mb={1}>
        سجل العمل الخاص بي
      </Typography>
      <Typography color="text.secondary" mb={2}>
        هذه الصفحة خاصة بك فقط — تتحقق من وجود سجل ضمن فترة، وتسجّل سجل عملك.
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {/* Check whether a log exists in a date range */}
        {canView && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
              <Typography variant="subtitle1" mb={2}>
                التحقق من وجود سجل
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="من تاريخ"
                  type="date"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="إلى تاريخ"
                  type="date"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={checking ? <CircularProgress size={16} /> : <FiSearch />}
                    onClick={runCheck}
                    disabled={!canCheck}
                  >
                    تحقق
                  </Button>
                </Box>
                {checkError && <Alert severity="error">{checkError}</Alert>}
                {checkResult !== null && !checkError && (
                  <Chip
                    icon={checkResult ? <FiCheckCircle /> : <FiXCircle />}
                    color={checkResult ? "success" : "default"}
                    label={
                      checkResult
                        ? "يوجد سجل ضمن هذه الفترة"
                        : "لا يوجد سجل ضمن هذه الفترة"
                    }
                    variant={checkResult ? "filled" : "outlined"}
                  />
                )}
              </Stack>
            </Paper>
          </Grid>
        )}

        {/* Submit a new self work-log */}
        {canSubmit && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
              <Typography variant="subtitle1" mb={2}>
                تسجيل سجل عمل جديد
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="التاريخ"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
                <TextField
                  label="الوصف"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  required
                  multiline
                  minRows={2}
                />
                <TextField
                  label="عدد الدقائق (اختياري)"
                  type="number"
                  value={totalMinutes}
                  onChange={(e) => setTotalMinutes(e.target.value)}
                  inputProps={{ min: 0 }}
                  fullWidth
                />
                <Box>
                  <Button
                    variant="contained"
                    startIcon={submitting ? <CircularProgress size={16} /> : <FiSend />}
                    onClick={runSubmit}
                    disabled={!canDoSubmit}
                  >
                    تسجيل
                  </Button>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

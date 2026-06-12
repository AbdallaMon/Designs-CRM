"use client";

// Sales-pipeline view for a single lead — the ordered stage list (reached / current / pending)
// with timestamps, plus the advance / roll-back workflow actions. LEAD-SCOPED: the parent lead
// is fixed (clientLeadId prop); the backend enforces the lead object-scope on every read/write
// (the dto emits NO capabilities.*), so write actions gate purely on the SALES_STAGE.MANAGE
// CODE — the server is the source of truth.
//
// Data shape bound: the read returns RAW SalesStage rows (only the REACHED stages):
//   [{ id, clientLeadId, userId, stage, createdAt }]
// buildPipelineView() maps those onto the canonical ordered pipeline and derives current/next.
//
// set-stage contract (matches the BE .strict() schema, wired in salesStages.service.js):
//   advance   → { nextStage: { key } }
//   roll-back → { action: "back", currentStageType }

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { MdCheckCircle, MdRadioButtonUnchecked, MdMyLocation } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { salesStagesService } from "../salesStages.service.js";
import { runSalesStagesMutation } from "../salesStages.mutations.js";
import { buildPipelineView, labelForStage } from "../config/salesStagesConfig.js";

const P = PERMISSIONS.SALES_STAGE;

function formatWhen(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("ar", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

export function SalesStagesPipeline({ clientLeadId, rows, isLoading, error, onChanged }) {
  const { hasPermission } = usePermission();
  const canManage = hasPermission(P.MANAGE);
  const { setLoading } = useToastContext();
  const [busy, setBusy] = useState(false);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">تعذر جلب مراحل البيع. حاول مرة أخرى.</Alert>;
  }

  const view = buildPipelineView(rows);
  const { steps, currentKey, nextKey, reachedCount } = view;

  async function advance() {
    if (!nextKey) return;
    setBusy(true);
    const res = await runSalesStagesMutation(
      () => salesStagesService.advanceStage(clientLeadId, { key: nextKey }),
      { setLoading, loading: "جاري الانتقال للمرحلة التالية..." },
    );
    setBusy(false);
    if (res) onChanged?.();
  }

  async function rollBack() {
    if (currentKey === "NOT_INITIATED") return;
    setBusy(true);
    const res = await runSalesStagesMutation(
      () => salesStagesService.rollBackStage(clientLeadId, { currentStageType: currentKey }),
      { setLoading, loading: "جاري التراجع عن المرحلة الحالية..." },
    );
    setBusy(false);
    if (res) onChanged?.();
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle1">
          مراحل البيع للعميل #{clientLeadId}
        </Typography>
        <Chip
          size="small"
          label={
            currentKey === "NOT_INITIATED"
              ? "لم تبدأ أي مرحلة"
              : `المرحلة الحالية: ${labelForStage(currentKey)}`
          }
          color={currentKey === "NOT_INITIATED" ? "default" : "primary"}
        />
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        تم إنجاز {reachedCount} من {steps.length} مراحل
      </Typography>

      <Divider sx={{ mb: 1 }} />

      <List dense disablePadding>
        {steps.map((step) => {
          const when = formatWhen(step.reachedAt);
          const Icon = step.current
            ? MdMyLocation
            : step.reached
              ? MdCheckCircle
              : MdRadioButtonUnchecked;
          const iconColor = step.current
            ? "primary.main"
            : step.reached
              ? "success.main"
              : "text.disabled";
          return (
            <ListItem
              key={step.key}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                bgcolor: step.current ? "action.selected" : "transparent",
              }}
              secondaryAction={
                step.current ? <Chip size="small" color="primary" label="الآن" /> : null
              }
            >
              <ListItemIcon sx={{ minWidth: 40, color: iconColor }}>
                <Icon size={22} />
              </ListItemIcon>
              <ListItemText
                primary={`${step.index + 1}. ${step.label}`}
                secondary={
                  step.reached
                    ? when
                      ? `وصلت في ${when}`
                      : "مكتملة"
                    : "لم تكتمل بعد"
                }
                primaryTypographyProps={{
                  fontWeight: step.current ? 700 : step.reached ? 600 : 400,
                  color: step.reached ? "text.primary" : "text.secondary",
                }}
              />
            </ListItem>
          );
        })}
      </List>

      {canManage && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" flexWrap="wrap">
            <Button
              variant="outlined"
              color="warning"
              disabled={busy || currentKey === "NOT_INITIATED"}
              onClick={rollBack}
            >
              تراجع عن المرحلة الحالية
            </Button>
            <Button variant="contained" disabled={busy || !nextKey} onClick={advance}>
              {nextKey
                ? `الانتقال إلى: ${labelForStage(nextKey)}`
                : "تم الوصول لنهاية المسار"}
            </Button>
          </Stack>
        </>
      )}
    </Paper>
  );
}

export default SalesStagesPipeline;

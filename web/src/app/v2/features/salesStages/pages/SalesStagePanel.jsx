"use client";

// SalesStagePanel — the lead-scoped sales-pipeline progression UI (§3.6). Renders the 10-stage
// SALES_STAGE_TYPES pipeline as a <StageStepper> strip with the two workflow CTAs:
//   • primary  "المرحلة التالية: …" → advanceStage({ key: <nextStageType> })
//   • secondary "رجوع"            → rollBackStage({ currentStageType })
// Both go through POST /:clientLeadId/actions/set-stage (the §5c dedicated workflow action).
//
// This component renders in TWO modes:
//   • variant="strip"  → a COMPACT, header-embedded strip (the default surface — best for
//                        "what's my next step", always visible at the top of the lead detail).
//   • variant="panel"  → a full SectionCard (e.g. a dedicated tab) — same data, more breathing room.
//
// LEAD-SCOPED: SalesStage rows are scoped to the parent ClientLead; the BE enforces the lead
// object-scope per record (the dto emits NO capabilities.*), so we gate on the SALES_STAGE.*
// CODES only — the server is the source of truth. Single-language Arabic / RTL.

import { useMemo, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { MdArrowBack, MdUndo } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { useT } from "@/app/v2/lib/i18n";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import {
  SectionCard,
  StageStepper,
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/app/v2/shared/components";
import { salesStagesUrl, SALES_STAGE_TYPES } from "../config/constant.js";
import salesStagesService from "../salesStages.service.js";
import { runSalesStagesMutation } from "../salesStages.mutations.js";
import { salesStagesMessages } from "../config/salesStagesMessages.js";

const P = PERMISSIONS.SALES_STAGE;

// Arabic fallbacks for the 10 SalesStageType stages (UI-only; the wire value stays the enum key).
// Resolved through t() at render time via buildStageLabel(t) — keep this map ONLY as the verbatim
// Arabic fallback so an empty dictionary still renders the original wording.
const STAGE_LABEL_FALLBACKS = {
  INITIAL_CONTACT: "أول تواصل",
  SOCIAL_MEDIA_CHECK: "مراجعة وسائل التواصل",
  WHATSAPP_QA: "أسئلة واتساب",
  MEETING_BOOKED: "حجز اجتماع",
  CLIENT_INFO_UPLOADED: "رفع بيانات العميل",
  CONSULTATION_BOOKED: "حجز استشارة",
  FOLLOWUP_AFTER_MEETING: "متابعة بعد الاجتماع",
  HANDLE_OBJECTIONS: "معالجة الاعتراضات",
  DEAL_CLOSED: "إغلاق الصفقة",
  AFTER_SALES_FOLLOWUP: "متابعة ما بعد البيع",
};

// Factory: returns a stageLabel(type) bound to the active translator. Call inside the component.
const buildStageLabel = (t) => (type) =>
  STAGE_LABEL_FALLBACKS[type]
    ? t(`salesStages.stage.${type}`, STAGE_LABEL_FALLBACKS[type])
    : type;

// Tolerant extraction of the CURRENT stage type out of the lead's sales-stages payload.
// The BE shape is not capability-bearing; accept the common envelopes (single object, array of
// rows, or a wrapper) and reduce to the latest stageType. NOT_INITIATED = pre-first-hop sentinel.
function currentStageTypeFrom(data) {
  if (!data) return "NOT_INITIATED";
  const direct =
    data.currentStageType || data.stageType || data.type || data.currentStage?.type;
  if (direct) return direct;
  const rows = Array.isArray(data) ? data : data.items ?? data.stages ?? [];
  if (!rows.length) return "NOT_INITIATED";
  // The furthest-along stage present in SALES_STAGE_TYPES order is "current".
  let best = "NOT_INITIATED";
  let bestIdx = -1;
  for (const r of rows) {
    const t = r.type ?? r.stageType ?? r.key;
    const idx = SALES_STAGE_TYPES.indexOf(t);
    if (idx > bestIdx) {
      bestIdx = idx;
      best = t;
    }
  }
  return best;
}

export function SalesStagePanel({ leadId, variant = "strip", onChanged }) {
  const { t } = useT();
  const stageLabel = useMemo(() => buildStageLabel(t), [t]);
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);
  const canManage = hasPermission(P.MANAGE);

  const [busy, setBusy] = useState(false);
  const hasLead = Boolean(leadId);

  const { data, isLoading, error, refetch } = useRequest({
    url: hasLead ? salesStagesUrl(leadId) : "",
    method: "get",
    autoFetch: canView && hasLead,
  });

  const currentType = useMemo(() => currentStageTypeFrom(data), [data]);

  // Index into the 10-stage pipeline. NOT_INITIATED → -1 (nothing done yet); the stepper shows
  // the first stage as the next action. A real stage → its index.
  const currentIndex = SALES_STAGE_TYPES.indexOf(currentType); // -1 when NOT_INITIATED
  const nextType =
    currentIndex < 0
      ? SALES_STAGE_TYPES[0]
      : SALES_STAGE_TYPES[currentIndex + 1] ?? null; // null = pipeline complete
  const isComplete = currentIndex >= 0 && nextType === null;

  // StageStepper.current expects the active index; mark every stage up to & including the
  // current one as done. When NOT_INITIATED, nothing is done and the active step is the first.
  const activeIndex = currentIndex < 0 ? 0 : currentIndex;
  const completedUpTo = currentIndex < 0 ? 0 : currentIndex + 1;

  const stages = useMemo(
    () => SALES_STAGE_TYPES.map((type) => ({ key: type, label: stageLabel(type) })),
    [stageLabel],
  );

  async function advance() {
    if (!nextType) return;
    const res = await runSalesStagesMutation(
      () => salesStagesService.advanceStage(leadId, { key: nextType }),
      {
        loading: t("salesStages.advancing", "جاري الانتقال للمرحلة التالية..."),
        setLoading: setBusy,
      },
    );
    if (res) {
      refetch();
      onChanged?.();
    }
  }

  async function rollBack() {
    const res = await runSalesStagesMutation(
      () => salesStagesService.rollBackStage(leadId, { currentStageType: currentType }),
      {
        loading: t("salesStages.rollingBack", "جاري الرجوع للمرحلة السابقة..."),
        setLoading: setBusy,
      },
    );
    if (res) {
      refetch();
      onChanged?.();
    }
  }

  if (!canView) {
    // In strip mode stay silent (the header shouldn't show a denial banner); in panel mode explain.
    return variant === "panel" ? (
      <SectionCard title={t("salesStages.panelTitle", "مرحلة البيع")}>
        <EmptyState
          title={t("salesStages.denied", "لا تملك صلاحية عرض مراحل البيع")}
          description={t(
            "salesStages.deniedDescription",
            "تواصل مع المسؤول لمنحك صلاحية الاطلاع على مراحل البيع لهذا العميل.",
          )}
        />
      </SectionCard>
    ) : null;
  }

  // Stepper + CTA cluster shared by both variants.
  const canRollBack = canManage && currentIndex >= 0;
  const body = (
    <>
      {isLoading ? (
        <LoadingState variant="detail" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} resolver={salesStagesMessages} />
      ) : (
        <Stack spacing={1.5}>
          <Box sx={{ overflowX: "auto", pb: 0.5 }}>
            <StageStepper stages={stages} current={activeIndex} completedUpTo={completedUpTo} />
          </Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ sm: "center" }}
            justifyContent="space-between"
          >
            <Typography variant="body2" color="text.secondary">
              {currentIndex < 0
                ? t("salesStages.notStarted", "لم تبدأ مراحل البيع بعد.")
                : isComplete
                  ? t("salesStages.allComplete", "اكتملت جميع مراحل البيع.")
                  : t("salesStages.currentStage", "المرحلة الحالية: {stage}").replace(
                      "{stage}",
                      stageLabel(currentType),
                    )}
            </Typography>
            {canManage && (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {canRollBack && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    startIcon={<MdUndo />}
                    onClick={rollBack}
                    disabled={busy}
                  >
                    {t("salesStages.rollBack", "رجوع")}
                  </Button>
                )}
                {nextType && (
                  <Button
                    size="small"
                    variant="contained"
                    // RTL: "next/forward" points to the inline-end = LEFT, so use MdArrowBack
                    // (matches the WizardSteps RTL convention). MdArrowForward (→) reads as "back".
                    endIcon={<MdArrowBack />}
                    onClick={advance}
                    disabled={busy}
                  >
                    {t("salesStages.nextStage", "المرحلة التالية: {stage}").replace(
                      "{stage}",
                      stageLabel(nextType),
                    )}
                  </Button>
                )}
              </Stack>
            )}
          </Stack>
        </Stack>
      )}
    </>
  );

  if (variant === "panel") {
    return (
      <SectionCard
        title={t("salesStages.panelTitle", "مرحلة البيع")}
        subtitle={t(
          "salesStages.panelSubtitle",
          "تقدّم العميل عبر مراحل خط أنابيب المبيعات العشرة.",
        )}
      >
        {body}
      </SectionCard>
    );
  }

  // strip: a light, framed band suited to the lead-detail header.
  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
        bgcolor: "background.paper",
        px: 2,
        py: 1.5,
      }}
    >
      {body}
    </Box>
  );
}

export default SalesStagePanel;

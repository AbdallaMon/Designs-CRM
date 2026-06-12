"use client";

// SURFACE 3 — PUBLIC client image-selection WIZARD (status state machine). UNGATED: the
// per-session token (query param `token`) IS the auth (NO AuthProvider, apiFetch.public,
// _skipRefresh). A StageStepper-driven wizard following SESSION_STATUS_FLOW:
//   الألوان → الخامات → الطرز → الصور لكل مساحة → معاينة → التوقيع → PDF
// Each selection step renders its reference grid + a live "اختياراتك حتى الآن" summary and saves
// token-authoritatively (the BE OVERRIDES session id/clientLeadId from the token). Confirmation
// statuses (INITIAL / SELECTED_* / PREVIEW_IMAGES) are simple next/back hops via PUT
// /session/status ({ token, sessionStatus } — §5c: token-keyed, NO client id). The final
// signature → /generate-pdf shows a BLOCKING "جارٍ إنشاء الملف…" overlay (frozen synchronous
// PDF), then a SuccessState with the download. Mirrors PublicContractSignPage. RTL.

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { MdArrowForward, MdArrowBack, MdFileDownload } from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n";
import {
  PageHeader, SectionCard, StageStepper, LoadingState, ErrorState, SuccessState,
} from "@/app/v2/shared/components";
import { useClientSession } from "../hooks/useClientSession.js";
import imageSessionsService from "../imageSessions.service.js";
import { runImageSessionMutation } from "../imageSessions.mutations.js";
import {
  SESSION_STATUS_FLOW, sessionStatusLabel, WIZARD_STEPS, buildWizardSteps, wizardStepIndex,
} from "../config/imageSessionsConstants.js";
import { SelectionSummary } from "../components/public/SelectionSummary.jsx";
import { ColorsStep, MaterialsStep, StylesStep, ImagesStep } from "../components/public/WizardSteps.jsx";
import { SignatureStep } from "../components/public/SignatureStep.jsx";

// Confirmation statuses → an info pane title (a simple next/back hop, no selection).
// { i18n key, Arabic fallback } resolved with t() inside the component.
const CONFIRM_TITLES = {
  INITIAL: ["imageSessions.public.confirm.INITIAL", "مرحبًا بك في جلسة اختيار التصاميم"],
  SELECTED_COLOR_PATTERN: ["imageSessions.public.confirm.SELECTED_COLOR_PATTERN", "تم حفظ اختيار الألوان"],
  SELECTED_MATERIAL: ["imageSessions.public.confirm.SELECTED_MATERIAL", "تم حفظ اختيار الخامات"],
  SELECTED_STYLE: ["imageSessions.public.confirm.SELECTED_STYLE", "تم حفظ اختيار الطراز"],
  PREVIEW_IMAGES: ["imageSessions.public.confirm.PREVIEW_IMAGES", "تم حفظ اختيار الصور"],
};

export function PublicImageSessionPage() {
  const { t } = useT();
  const sp = useSearchParams();
  const token = sp.get("token");
  const { session, status, refetch } = useClientSession(token);
  const [busy, setBusy] = useState(false);
  const confirmTitle = (s) => {
    const entry = CONFIRM_TITLES[s];
    return entry ? t(entry[0], entry[1]) : null;
  };

  const flow = SESSION_STATUS_FLOW[status] || { next: null, back: null };

  // Advance/rewind via PUT /session/status (token-only — no client id). §5c.
  async function changeStatus(targetStatus) {
    if (!targetStatus) return;
    const res = await runImageSessionMutation(
      () => imageSessionsService.changeStatus({ token, sessionStatus: targetStatus }),
      { loading: t("imageSessions.public.savingLoading", "جاري الحفظ..."), setLoading: setBusy },
    );
    if (res) await refetch();
  }

  function renderBody() {
    switch (status) {
      case "LOADING":
        return <LoadingState variant="detail" />;

      case "ERROR":
        return (
          <ErrorState
            title={t("imageSessions.public.invalidLinkTitle", "رابط الجلسة غير صالح")}
            error="IMAGE_SESSION_TOKEN_INVALID"
            resolver={undefined}
          />
        );

      // ── selection steps ───────────────────────────────────────────────────────────────
      case "PREVIEW_COLOR_PATTERN":
        return <ColorsStep session={session} nextStatus={flow.next} onBack={() => changeStatus(flow.back)} onUpdate={refetch} busy={busy} />;
      case "PREVIEW_MATERIAL":
        return <MaterialsStep session={session} nextStatus={flow.next} onBack={() => changeStatus(flow.back)} onUpdate={refetch} busy={busy} />;
      case "PREVIEW_STYLE":
        return <StylesStep session={session} nextStatus={flow.next} onBack={() => changeStatus(flow.back)} onUpdate={refetch} busy={busy} />;
      case "SELECTED_STYLE":
        // The image-pick grid (scoped to selected spaces + chosen style).
        return <ImagesStep session={session} nextStatus={flow.next} onBack={() => changeStatus(flow.back)} onUpdate={refetch} busy={busy} />;

      // ── signature + PDF ───────────────────────────────────────────────────────────────
      case "SELECTED_IMAGES":
        return <SignatureStep session={session} token={token} nextStatus={flow.next} onBack={() => changeStatus(flow.back)} onUpdate={refetch} disabled={busy} />;

      // ── terminal ──────────────────────────────────────────────────────────────────────
      case "PDF_GENERATED":
      case "SUBMITTED":
        return (
          <SuccessState
            title={t("imageSessions.public.successTitle", "تم إرسال اختياراتك بنجاح")}
            message={t("imageSessions.public.successMessage", "شكرًا لك. سيتواصل معك فريقنا قريبًا.")}
            primary={
              session?.pdfUrl
                ? { label: t("imageSessions.public.downloadFile", "تحميل الملف"), href: session.pdfUrl, icon: <MdFileDownload /> }
                : undefined
            }
          />
        );

      // ── confirmation hops (INITIAL / SELECTED_* / PREVIEW_IMAGES) ───────────────────────
      default:
        return (
          <SectionCard title={confirmTitle(status) || sessionStatusLabel(status, t) || t("imageSessions.public.continue", "متابعة")}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {status === "INITIAL"
                ? t("imageSessions.public.startHint", "اضغط «التالي» للبدء باختيار الألوان.")
                : t("imageSessions.public.reviewHint", "راجع اختياراتك بالأسفل ثم تابع إلى الخطوة التالية.")}
            </Typography>
            <Stack direction="row" spacing={1}>
              {flow.back && (
                <Button variant="outlined" startIcon={<MdArrowForward />} onClick={() => changeStatus(flow.back)} disabled={busy}>
                  {t("imageSessions.public.previous", "السابق")}
                </Button>
              )}
              <Box sx={{ flexGrow: 1 }} />
              {flow.next && (
                <Button variant="contained" endIcon={<MdArrowBack />} onClick={() => changeStatus(flow.next)} disabled={busy}>
                  {t("imageSessions.public.next", "التالي")}
                </Button>
              )}
            </Stack>
          </SectionCard>
        );
    }
  }

  const showShell = status !== "LOADING" && status !== "ERROR";
  const stepIndex = wizardStepIndex(status);

  return (
    <Container maxWidth="md" sx={{ py: 2, pb: 8 }} dir="rtl">
      {showShell && (
        <>
          <PageHeader
            title={t("imageSessions.public.headerTitle", "اختيار التصاميم")}
            subtitle={t("imageSessions.public.headerSubtitle", "الخطوة {current} من {total}")
              .replace("{current}", Math.min(stepIndex + 1, WIZARD_STEPS.length))
              .replace("{total}", WIZARD_STEPS.length)}
            roleChip={false}
          />
          <Box sx={{ mb: 3, overflowX: "auto" }}>
            <StageStepper stages={buildWizardSteps(t)} current={stepIndex} />
          </Box>
        </>
      )}

      <Stack spacing={3}>
        {renderBody()}
        {showShell && status !== "PDF_GENERATED" && status !== "SUBMITTED" && (
          <SelectionSummary session={session} />
        )}
      </Stack>
    </Container>
  );
}

export default PublicImageSessionPage;

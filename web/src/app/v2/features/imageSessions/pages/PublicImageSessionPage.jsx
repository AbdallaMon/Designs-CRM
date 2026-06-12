"use client";

// SURFACE 3 — PUBLIC client image-selection page (status state machine). Ported from the legacy
// ClientImageSelection (UiComponents/DataViewer/image-session/client-session/), SINGLE-LANGUAGE
// Arabic, wired to the v2 token-based public surface. UNGATED — the per-session token (query
// param `token`) IS the auth (NO AuthProvider, apiFetch.public, _skipRefresh).
//
// Status flow (preserved 1:1 from helpers.sessionStatusFlow → SESSION_STATUS_FLOW): INITIAL →
// PREVIEW/SELECTED color → material → style → images → SELECTED_IMAGES (signature) →
// PDF_GENERATED/SUBMITTED. simpleHandleNext/Back advance/rewind via PUT /session/status with
// body { token, sessionStatus } — §5c: token-keyed only, NO client id.
//
// §5c deltas relevant to this surface:
//  • #2 the per-step image deletion sends the session token in the DELETE BODY
//    (imageSessionsService.deleteImage(imageId, token)) — see the step components mounted here.
//  • #1 the design-images list read here is nested under res.data.
//
// The deeply-bespoke per-step UI (color palette / materials / styles / image grid / signature
// + frozen chunk-upload) are ported as dedicated step components onto THIS page's service +
// status-machine layer. This page is the public, token-resolved shell that drives them.

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Box, Container, Typography } from "@mui/material";
import { useClientSession } from "../hooks/useClientSession.js";
import imageSessionsService from "../imageSessions.service.js";
import { runImageSessionMutation } from "../imageSessions.mutations.js";
import { SESSION_STATUS_FLOW } from "../config/imageSessionsConstants.js";

export function PublicImageSessionPage() {
  const sp = useSearchParams();
  const token = sp.get("token");
  const { session, status, refetch } = useClientSession(token);
  const [busy, setBusy] = useState(false);

  // Advance/rewind the session status (token-only — no client id). §5c.
  async function changeStatus(targetStatus) {
    if (!targetStatus) return;
    const res = await runImageSessionMutation(
      () => imageSessionsService.changeStatus({ token, sessionStatus: targetStatus }),
      { loading: "جاري الحفظ...", setLoading: setBusy },
    );
    if (res) await refetch();
  }

  const flow = SESSION_STATUS_FLOW[status] || { next: null, back: null };

  function renderStep() {
    switch (status) {
      case "LOADING":
        return (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <Typography color="text.secondary">جاري التحميل...</Typography>
          </Box>
        );
      case "PDF_GENERATED":
      case "SUBMITTED":
        return (
          <Box sx={{ px: 2, textAlign: "center", py: 6 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>تم إرسال اختياراتك بنجاح</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>شكرًا لك. سيتواصل معك فريقنا قريبًا.</Typography>
            {session?.pdfUrl && (
              <Typography component="a" href={session.pdfUrl} target="_blank" color="primary">
                تحميل الملف
              </Typography>
            )}
          </Box>
        );
      case "ERROR":
        return (
          <Alert severity="error" sx={{ px: 2, textAlign: "center", py: 4 }}>
            <Typography variant="h5" color="error">حدث خطأ ما</Typography>
            <Typography variant="caption" color="warning.main">
              يرجى التواصل مع خدمة العملاء لإنشاء رابط جديد
            </Typography>
          </Alert>
        );
      default:
        // INITIAL / PREVIEW_* / SELECTED_* / SELECTED_IMAGES — the bespoke step components mount
        // here, driven by `session`, `token`, `busy`, and the status-machine handlers below.
        return (
          <Box sx={{ px: 2, py: 4 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>جلسة اختيار التصاميم</Typography>
            <Typography color="text.secondary">
              الخطوة الحالية: {status}
            </Typography>
            <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
              {flow.back && (
                <Typography
                  component="button"
                  onClick={() => changeStatus(flow.back)}
                  sx={{ cursor: "pointer", background: "none", border: 0, color: "text.secondary" }}
                  disabled={busy}
                >
                  السابق
                </Typography>
              )}
              {flow.next && (
                <Typography
                  component="button"
                  onClick={() => changeStatus(flow.next)}
                  sx={{ cursor: "pointer", background: "none", border: 0, color: "primary.main" }}
                  disabled={busy}
                >
                  التالي
                </Typography>
              )}
            </Box>
          </Box>
        );
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 1, pb: 8, px: 0 }} dir="rtl">
      {renderStep()}
    </Container>
  );
}

export default PublicImageSessionPage;

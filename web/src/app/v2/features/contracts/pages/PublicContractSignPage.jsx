"use client";

// PUBLIC contract e-sign page (status machine). Ported from the legacy
// `client/ClientContractPage.jsx`, SINGLE-LANGUAGE Arabic, wired to the v2 token-based public
// surface. UNGATED — the per-session arToken (query param `token`) IS the auth (no session,
// apiFetch.public, _skipRefresh).
//
// Status flow (preserved): INITIAL → SIGNING → REGISTERED.
//  • INITIAL: review the contract; "تأكيد والانتقال للتوقيع" advances to SIGNING via
//    PUT /session/status with body { token, sessionStatus } — §5c: NO client `id` is sent.
//  • SIGNING: draw/upload a signature → /generate-pdf (token-authoritative) → REGISTERED.
//  • REGISTERED: download the PDF links.

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Box, Container, Typography } from "@mui/material";
import { useContractSession } from "../hooks/useContractSession.js";
import contractsService from "../contracts.service.js";
import { runContractMutation } from "../contracts.mutations.js";
import ContractSessionView from "../components/public/ContractSessionView.jsx";
import ContractSignature from "../components/public/ContractSignature.jsx";
import ContractSignedSuccess from "../components/public/ContractSignedSuccess.jsx";

// status → { next, back } (preserved from legacy helpers.contractSessionStatusFlow).
const STATUS_FLOW = {
  INITIAL: { next: "SIGNING", back: null },
  SIGNING: { next: "REGISTERED", back: "INITIAL" },
  REGISTERED: { next: null, back: "SIGNING" },
};

export function PublicContractSignPage() {
  const sp = useSearchParams();
  const token = sp.get("token");
  const { session, contractUtility, status, refetch } = useContractSession(token);
  const [busy, setBusy] = useState(false);

  // Advance/rewind the session status (token-only — no client id).
  async function changeStatus(targetStatus) {
    if (!targetStatus) return;
    const res = await runContractMutation(
      () => contractsService.changeSessionStatus({ token, sessionStatus: targetStatus }),
      { loading: "جاري الحفظ...", setLoading: setBusy },
    );
    if (res) await refetch();
  }

  function renderStep() {
    switch (status) {
      case "LOADING":
        return (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <Typography color="text.secondary">جاري التحميل...</Typography>
          </Box>
        );
      case "INITIAL":
        return (
          <Box sx={{ px: 2 }}>
            <ContractSessionView
              session={session}
              contractUtility={contractUtility}
              onSubmit={() => changeStatus(STATUS_FLOW.INITIAL.next)}
            />
          </Box>
        );
      case "SIGNING":
        return (
          <ContractSignature
            session={session}
            token={token}
            disabled={busy}
            onSignatureSaved={refetch}
            handleBack={() => changeStatus(STATUS_FLOW.SIGNING.back)}
          />
        );
      case "REGISTERED":
        return (
          <Box sx={{ px: 2 }}>
            <ContractSignedSuccess pdfAr={session?.pdfLinkAr} pdfEn={session?.pdfLinkEn} />
          </Box>
        );
      default:
        return (
          <Alert severity="error" sx={{ px: 2, textAlign: "center", py: 4 }}>
            <Typography variant="h5" color="error">حدث خطأ ما</Typography>
            <Typography variant="caption" color="warning.main">
              يرجى التواصل مع خدمة العملاء لإنشاء رابط جديد
            </Typography>
          </Alert>
        );
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 1, pb: 8, px: 0 }} dir="rtl">
      {renderStep()}
    </Container>
  );
}

export default PublicContractSignPage;

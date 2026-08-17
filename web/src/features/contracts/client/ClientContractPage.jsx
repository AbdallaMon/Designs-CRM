"use client";
import { CONTRACT_SESSION_STATUSES } from "@dms/shared";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { ClientImageAppBar } from "@/features/image-session/client-session/Utility.jsx";
import { useCallback, useEffect, useState } from "react";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { Alert, Box, Container, Typography } from "@mui/material";
import FullScreenLoader from "@/shared/components/feedback/loaders/FullscreenLoader";
import ContractSession from "@/features/contracts/client/ContractSession.jsx";
import {
  contractSessionStatusFlow,
  isContractUtilityReady,
} from "@/features/contracts/client/helpers.js";
import ContractSignature from "@/features/contracts/client/ContractSignature.jsx";
import ContractSignedSuccessSection from "@/features/contracts/client/ContractSignedSuccessSection.jsx";
const AnimatedComponent = ({
  children,
  animationType = "fade",
  direction = "left",
  timeout = 500,
}) => {
  return <>{children}</>;
};
export default function ClientContractPage({ token }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [contractUtility, setContractUtility] = useState(null);
  const status = loading ? "LOADING" : session?.sessionStatus || "ERROR";
  const { lng } = useLanguageSwitcherContext();
  const { loading: toastLoading, setLoading: setToastLoading } =
    useToastContext();
  const getSessionData = useCallback(async () => {
    // The v2 backend nests master's flat `{ data: session, contractUtility }` body inside the
    // envelope's own `data` field, so the normalized result is `req.data = { data, contractUtility }`.
    // Unwrap both here (a plain `setData: setSession` would store the wrapper, not the session).
    const req = await getDataAndSet({
      url: `client/contracts/session?token=${token}&lng=${lng}&`,
      setLoading,
    });
    setSession(req?.data?.data || null);
    setContractUtility(req?.data?.contractUtility || null);
  }, [lng, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void getSessionData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [getSessionData]);

  async function simpleHandleNext() {
    const req = await handleRequestSubmit(
      {
        token: token,
        sessionStatus: contractSessionStatusFlow[status].next,
      },
      setToastLoading,
      `client/contracts/session/status`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (req.status === 200) {
      await getSessionData();
    }
  }

  function getSessionStatusComponent() {
    switch (status) {
      case "LOADING":
        return (
          <AnimatedComponent
            key="loading"
            animationType="fade"
            timeout={600}
          >
            <FullScreenLoader />
          </AnimatedComponent>
        );
      case CONTRACT_SESSION_STATUSES.INITIAL:
        if (!isContractUtilityReady(contractUtility)) {
          return (
            <Alert severity="warning" sx={{ mx: 2, px: 2, py: 4, textAlign: "center" }}>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {lng === "ar"
                  ? "بيانات العقد غير مكتملة"
                  : "Contract details are not configured"}
              </Typography>
              <Typography variant="body2">
                {lng === "ar"
                  ? "يرجى التواصل مع خدمة العملاء قبل متابعة توقيع العقد."
                  : "Please contact customer service before continuing with the contract."}
              </Typography>
            </Alert>
          );
        }
        return (
          <AnimatedComponent
            key="initial"
            animationType="fade"
            timeout={600}
          >
            <Box sx={{ px: 2 }}>
              <ContractSession
                session={session}
                lng={lng}
                onSubmit={simpleHandleNext}
                contractUtility={contractUtility}
              />
            </Box>
          </AnimatedComponent>
        );
      case CONTRACT_SESSION_STATUSES.SIGNING:
        return (
          <AnimatedComponent
            key="signing"
            animationType="slide"
            direction="left"
            timeout={500}
          >
            <ContractSignature
              session={session}
              token={token}
              onSignatureSaved={getSessionData}
              nextStatus={contractSessionStatusFlow[status].next}
              disabled={toastLoading}
            />
          </AnimatedComponent>
        );
      case CONTRACT_SESSION_STATUSES.REGISTERED:
        return (
          <AnimatedComponent
            key="registered"
            animationType="zoom"
            timeout={400}
          >
            <Box sx={{ px: 2 }}>
              <ContractSignedSuccessSection
                lng={lng}
                pdfAr={session?.pdfLinkAr}
                pdfEn={session?.pdfLinkEn}
              />
            </Box>
          </AnimatedComponent>
        );
      default:
        return (
          <AnimatedComponent
            key="error"
            animationType="fade"
            timeout={500}
          >
            <Alert
              severity="error"
              sx={{ px: 2, textAlign: "center !important", py: 4 }}
            >
              <Typography variant="h4" color="error">
                {lng === "ar" ? "حدث خطأ ما" : "Something went wrong"}
              </Typography>

              <Typography variant="caption" color="warning">
                {lng === "ar"
                  ? "يرجى التواصل مع خدمة العملاء لإنشاء رابط جديد"
                  : "Ask customer service to generate a new link"}
              </Typography>
            </Alert>
          </AnimatedComponent>
        );
    }
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 1, pb: 8, px: 0 }}>
        <Box sx={{ mb: 2, px: 2 }}>
          <ClientImageAppBar />
        </Box>
        {getSessionStatusComponent()}
      </Container>
    </>
  );
}

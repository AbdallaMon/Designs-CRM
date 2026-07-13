"use client";

import { Alert, Box, Container, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import PageInfoComponent from "@/features/image-session/client-session/PageInfo.jsx";
import { ClientImageAppBar } from "@/features/image-session/client-session/Utility.jsx";
import { PageInfoType } from "@/app/helpers/constants";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { sessionStatusFlow } from "@/features/image-session/client-session/helpers.js";
import { ColorPalletes } from "@/features/image-session/client-session/colors/ColorPalletes.jsx";
import { Styles } from "@/features/image-session/client-session/styles/Styles.jsx";
import { Images } from "@/features/image-session/client-session/Images.jsx";
import { SelectedImages } from "@/features/image-session/client-session/SelectedImages.jsx";
import SignatureComponent from "@/features/image-session/client-session/SignatureComponent.jsx";
import { ClientSessionSubmitted } from "@/features/image-session/client-session/ClientSessionSubmitted.jsx";
import FullScreenLoader from "@/shared/components/feedback/loaders/FullscreenLoader";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { Materials } from "@/features/image-session/client-session/material/Materials.jsx";

export default function ClientImageSelection({ token }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [error, setError] = useState();
  const status = loading ? "LOADING" : session?.sessionStatus || "ERROR";
  const { lng } = useLanguageSwitcherContext();
  const { loading: toastLoading, setLoading: setToastLoading } =
    useToastContext();

  async function getSessionData() {
    await getDataAndSet({
      url: `client/image-session/session?token=${token}&`,
      setData: setSession,
      setLoading,
      setError,
    });
  }

  useEffect(() => {
    getSessionData();
  }, []);

  async function simpleHandleNext() {
    const req = await handleRequestSubmit(
      { token, sessionStatus: sessionStatusFlow[status].next },
      setToastLoading,
      `client/image-session/session/status`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (req.status === 200) {
      await getSessionData();
    }
  }

  async function simpleHandleBack() {
    const req = await handleRequestSubmit(
      { token, sessionStatus: sessionStatusFlow[status].back },
      setToastLoading,
      `client/image-session/session/status`,
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
        return <FullScreenLoader />;
      case "INITIAL":
        return (
          <Box sx={{ px: 2 }}>
            <PageInfoComponent
              type={PageInfoType.BEFORE_PATTERN}
              session={session}
              disabled={toastLoading}
              handleBack={simpleHandleBack}
              handleNext={simpleHandleNext}
            />
          </Box>
        );
      case "PREVIEW_COLOR_PATTERN":
        return (
          <ColorPalletes
            handleBack={simpleHandleBack}
            handleNext={simpleHandleNext}
            disabled={toastLoading}
            nextStatus={sessionStatusFlow[status].next}
            onUpdate={getSessionData}
            session={session}
          />
        );
      case "SELECTED_COLOR_PATTERN":
        return (
          <Box sx={{ px: 2 }}>
            <PageInfoComponent
              type={PageInfoType.BEFORE_MATERIAL}
              session={session}
              disabled={toastLoading}
              handleBack={simpleHandleBack}
              handleNext={simpleHandleNext}
            />
          </Box>
        );
      case "PREVIEW_MATERIAL":
        return (
          <Materials
            handleBack={simpleHandleBack}
            disabled={toastLoading}
            nextStatus={sessionStatusFlow[status].next}
            onUpdate={getSessionData}
            session={session}
          />
        );
      case "SELECTED_MATERIAL":
        return (
          <Box sx={{ px: 2 }}>
            <PageInfoComponent
              type={PageInfoType.BEFORE_STYLE}
              session={session}
              disabled={toastLoading}
              handleBack={simpleHandleBack}
              handleNext={simpleHandleNext}
            />
          </Box>
        );
      case "PREVIEW_STYLE":
        return (
          <Styles
            handleBack={simpleHandleBack}
            disabled={toastLoading}
            nextStatus={sessionStatusFlow[status].next}
            onUpdate={getSessionData}
            session={session}
          />
        );
      case "SELECTED_STYLE":
        return (
          <Images
            handleBack={simpleHandleBack}
            disabled={toastLoading}
            nextStatus={sessionStatusFlow[status].next}
            onUpdate={getSessionData}
            session={session}
          />
        );
      case "PREVIEW_IMAGES":
        return (
          <SelectedImages
            handleBack={simpleHandleBack}
            disabled={toastLoading}
            nextStatus={sessionStatusFlow[status].next}
            onUpdate={getSessionData}
            session={session}
            handleNext={simpleHandleNext}
            loading={loading}
          />
        );
      case "SELECTED_IMAGES":
        return (
          <SignatureComponent
            session={session}
            token={token}
            onSignatureSaved={getSessionData}
            nextStatus={sessionStatusFlow[status].next}
            handleBack={simpleHandleBack}
            disabled={toastLoading}
          />
        );
      case "PDF_GENERATED":
      case "SUBMITTED":
        return <ClientSessionSubmitted session={session} loading={loading} />;
      default:
        return (
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
        );
    }
  }

  const showChrome = status !== "LOADING";

  return (
    <Container maxWidth="md" sx={{ py: 1, px: 0 }}>
      {showChrome && (
        <Box sx={{ mb: 2, px: 2 }}>
          <ClientImageAppBar />
        </Box>
      )}
      {getSessionStatusComponent()}
    </Container>
  );
}

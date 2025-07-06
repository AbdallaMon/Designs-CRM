"use client";

import {
  Alert,
  Box,
  Container,
  Fade,
  Slide,
  Typography,
  Zoom,
} from "@mui/material";
import { useEffect, useState } from "react";
import PageInfoComponent from "./PageInfo";
import { ClientImageAppBar } from "./Utility";
import { PageInfoType } from "@/app/helpers/constants";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { sessionStatusFlow } from "./helpers";
import { ColorPalletes } from "./ColorPalletes";
import { Materials } from "./Materials";
import { Styles } from "./Styles";
import { Images } from "./Images";
import { SelectedImages } from "./SelectedImages";
import SignatureComponent from "./SignatureComponet";
import { ClientSessionSubmitted } from "./ClientSessionSubmitted";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";

const steps = [
  "Select Colors",
  "Select Material",
  "Select Style",
  "Choose Images",
  "Review & Notes",
  "Sign & Approve",
];

// Animation wrapper component
const AnimatedComponent = ({
  children,
  animationType = "fade",
  direction = "left",
  timeout = 500,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return <>{children}</>;
  switch (animationType) {
    case "slide":
      return (
        <Slide direction={direction} in={mounted} timeout={timeout}>
          <Box>{children}</Box>
        </Slide>
      );
    case "zoom":
      return (
        <Zoom in={mounted} timeout={timeout}>
          <Box>{children}</Box>
        </Zoom>
      );
    case "fade":
    default:
      return (
        <Fade in={mounted} timeout={timeout}>
          <Box>{children}</Box>
        </Fade>
      );
  }
};

export default function ClientImageSelection({ token }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [error, setError] = useState();
  const [animationKey, setAnimationKey] = useState(0); // Key to force re-animation
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

  useEffect(() => {
    setAnimationKey((prev) => prev + 1);
  }, [status]);

  async function simpleHandleNext() {
    const req = await handleRequestSubmit(
      {
        token: token,
        sessionStatus: sessionStatusFlow[status].next,
      },
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
      {
        token: token,
        sessionStatus: sessionStatusFlow[status].back,
      },
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
        return (
          <AnimatedComponent
            key={`initial-${animationKey}`}
            animationType="fade"
            timeout={600}
          >
            <FullScreenLoader />
          </AnimatedComponent>
        );
      case "INITIAL":
        return (
          <AnimatedComponent
            key={`initial-${animationKey}`}
            animationType="fade"
            timeout={600}
          >
            <Box sx={{ px: 2 }}>
              <PageInfoComponent
                type={PageInfoType.BEFORE_PATTERN}
                session={session}
                disabled={toastLoading}
                handleBack={simpleHandleBack}
                handleNext={simpleHandleNext}
              />
            </Box>
          </AnimatedComponent>
        );
      case "PREVIEW_COLOR_PATTERN":
        return (
          <AnimatedComponent
            key={`color-${animationKey}`}
            animationType="slide"
            direction="left"
            timeout={500}
          >
            <ColorPalletes
              handleBack={simpleHandleBack}
              handleNext={simpleHandleNext}
              disabled={toastLoading}
              nextStatus={sessionStatusFlow[status].next}
              onUpdate={getSessionData}
              session={session}
            />
          </AnimatedComponent>
        );
      case "SELECTED_COLOR_PATTERN":
        return (
          <AnimatedComponent
            key={`selected-color-${animationKey}`}
            animationType="zoom"
            timeout={400}
          >
            <Box sx={{ px: 2 }}>
              <PageInfoComponent
                type={PageInfoType.BEFORE_MATERIAL}
                session={session}
                disabled={toastLoading}
                handleBack={simpleHandleBack}
                handleNext={simpleHandleNext}
              />
            </Box>
          </AnimatedComponent>
        );
      case "PREVIEW_MATERIAL":
        return (
          <AnimatedComponent
            key={`material-${animationKey}`}
            animationType="slide"
            direction="right"
            timeout={500}
          >
            <Materials
              handleBack={simpleHandleBack}
              disabled={toastLoading}
              nextStatus={sessionStatusFlow[status].next}
              onUpdate={getSessionData}
              session={session}
            />
          </AnimatedComponent>
        );
      case "SELECTED_MATERIAL":
        return (
          <AnimatedComponent
            key={`selected-material-${animationKey}`}
            animationType="fade"
            timeout={600}
          >
            <Box sx={{ px: 2 }}>
              <PageInfoComponent
                type={PageInfoType.BEFORE_STYLE}
                session={session}
                disabled={toastLoading}
                handleBack={simpleHandleBack}
                handleNext={simpleHandleNext}
              />
            </Box>
          </AnimatedComponent>
        );
      case "PREVIEW_STYLE":
        return (
          <AnimatedComponent
            key={`style-${animationKey}`}
            animationType="slide"
            direction="up"
            timeout={500}
          >
            <Box sx={{ px: 0 }}>
              <Styles
                handleBack={simpleHandleBack}
                disabled={toastLoading}
                nextStatus={sessionStatusFlow[status].next}
                onUpdate={getSessionData}
                session={session}
              />
            </Box>
          </AnimatedComponent>
        );
      case "SELECTED_STYLE":
        return (
          <AnimatedComponent
            key={`selected-style-${animationKey}`}
            animationType="zoom"
            timeout={400}
          >
            <Images
              handleBack={simpleHandleBack}
              disabled={toastLoading}
              nextStatus={sessionStatusFlow[status].next}
              onUpdate={getSessionData}
              session={session}
            />
          </AnimatedComponent>
        );
      case "PREVIEW_IMAGES":
        return (
          <AnimatedComponent
            key={`images-${animationKey}`}
            animationType="slide"
            direction="left"
            timeout={500}
          >
            <SelectedImages
              handleBack={simpleHandleBack}
              disabled={toastLoading}
              nextStatus={sessionStatusFlow[status].next}
              onUpdate={getSessionData}
              session={session}
              handleNext={simpleHandleNext}
              loading={loading}
            />
          </AnimatedComponent>
        );
      case "SELECTED_IMAGES":
        return (
          <AnimatedComponent
            key={`selected-images-${animationKey}`}
            animationType="fade"
            timeout={600}
          >
            <SignatureComponent
              session={session}
              token={token}
              onSignatureSaved={getSessionData}
              nextStatus={sessionStatusFlow[status].next}
              handleBack={simpleHandleBack}
              disabled={toastLoading}
            />
          </AnimatedComponent>
        );
      case "PDF_GENERATED":
      case "SUBMITTED":
        return (
          <AnimatedComponent
            key={`submitted-${animationKey}`}
            animationType="slide"
            direction="up"
            timeout={600}
          >
            <ClientSessionSubmitted session={session} loading={loading} />
          </AnimatedComponent>
        );
      default:
        return (
          <AnimatedComponent
            key={`default-${animationKey}`}
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

  const removeAppBar = session?.sessionStatus === "PREVIEW_COLOR_PATTERN";
  const removePy = session?.sessionStatus === "PREVIEW_COLOR_PATTERN";

  return (
    <>
      <Container
        maxWidth="md"
        sx={{ py: removePy ? 0 : 1, pb: removePy ? 0 : 8, px: 0 }}
      >
        {!removeAppBar && (
          <Box sx={{ mb: 2, px: 2 }}>
            <ClientImageAppBar />
          </Box>
        )}
        {getSessionStatusComponent()}
      </Container>
    </>
  );
}

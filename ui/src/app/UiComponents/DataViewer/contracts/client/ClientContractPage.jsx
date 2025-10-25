"use client";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { ClientImageAppBar } from "../../image-session/client-session/Utility";
import { useEffect, useState } from "react";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { Alert, Box, Container, Typography } from "@mui/material";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import ContractSession from "./ContractSession";
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
};
export default function ClientContractPage({ token }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [animationKey, setAnimationKey] = useState(0); // Key to force re-animation
  const status = loading ? "LOADING" : session?.sessionStatus || "ERROR";
  const { lng } = useLanguageSwitcherContext();
  const { loading: toastLoading, setLoading: setToastLoading } =
    useToastContext();
  async function getSessionData() {
    await getDataAndSet({
      url: `client/contracts/session?token=${token}&`,
      setData: setSession,
      setLoading,
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

  async function simpleHandleBack() {
    const req = await handleRequestSubmit(
      {
        token: token,
        sessionStatus: sessionStatusFlow[status].back,
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
              <ContractSession
                session={session}
                lng={lng}
                onSubmit={simpleHandleNext}
              />
            </Box>
          </AnimatedComponent>
        );
      case "SIGNING":
        return (
          <AnimatedComponent
            key={`color-${animationKey}`}
            animationType="slide"
            direction="left"
            timeout={500}
          ></AnimatedComponent>
        );
      case "REGISTERED":
        return (
          <AnimatedComponent
            key={`selected-color-${animationKey}`}
            animationType="zoom"
            timeout={400}
          >
            <Box sx={{ px: 2 }}></Box>
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

  return (
    <>
      <Container maxWidth="md" sx={{ py: 1, pb: 8, px: 0 }}>
        <Box sx={{ mb: 2, px: 2 }}>
          <ClientImageAppBar />
        </Box>
        {getSessionStatusComponent()}
      </Container>
    </>
  );
}

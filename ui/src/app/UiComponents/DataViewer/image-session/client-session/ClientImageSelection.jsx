"use client";

import { Box, Container } from "@mui/material";
import { useEffect, useState } from "react";
import PageInfoComponent from "./PageInfo";
import { ClientImageAppBar } from "./Utility";
import { PageInfoType } from "@/app/helpers/constants";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { sessionStatusFlow } from "./helpers";
const steps = [
  "Select Colors",
  "Select Materail",
  "Select Style",
  "Choose Images",
  "Review & Notes",
  "Sign & Approve",
];

export default function ClientImageSelection({ token }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const status = session?.sessionStatus || "INITIAL";
  const { loading: toastLoading, setLoading: setToastLoading } =
    useToastContext();
  console.log(session, "session");
  async function getSessionData() {
    await getDataAndSet({
      url: `client/image-session/session?token=${token}&`,
      setData: setSession,
      setLoading,
    });
  }
  useEffect(() => {
    getSessionData();
  }, []);

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
        return "Please review the color palette options.";
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
        return "Review the available materials.";
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
        return "Preview available design styles.";
      case "SELECTED_STYLE":
        return "You have selected a design style.";
      case "PREVIEW_IMAGES":
        return "Preview design images based on your selections.";
      case "SELECTED_IMAGES":
        return "Images have been selected.";
      case "PDF_GENERATED":
        return "A summary PDF has been generated.";
      case "SUBMITTED":
        return "Session has been submitted successfully.";
      default:
        return "Session is in progress.";
    }
  }
  return (
    <>
      <Container maxWidth="md" sx={{ py: 2, pb: 8, px: 0 }}>
        <Box sx={{ mb: 3, px: 2 }}>
          <ClientImageAppBar />
        </Box>
        {getSessionStatusComponent()}
      </Container>
    </>
  );
}

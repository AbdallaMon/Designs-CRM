"use client";

import { ClientSelectedImages } from "@/features/image-session/client-session/ClientSelectedImages.jsx";
import { useRef } from "react";

export function SelectedImages({
  session,
  handleBack,
  disabled,
  nextStatus,
  handleNext,
  loading,
}) {
  const cardsRef = useRef([]);
  const titleRef = useRef();
  return (
    <ClientSelectedImages
      cardsRef={cardsRef}
      disabled={disabled}
      handleBack={handleBack}
      handleNext={handleNext}
      loading={loading}
      nextStatus={nextStatus}
      session={session}
      titleRef={titleRef}
      canDelete={true}
    />
  );
}

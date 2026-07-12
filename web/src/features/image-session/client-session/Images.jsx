"use client";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { useEffect, useState, useRef } from "react";
import FullScreenLoader from "@/shared/components/feedback/loaders/FullscreenLoader";
import { Box } from "@mui/material";
import {
  StepActionBar,
  StepNav,
  STEP_ACTION_BAR_SPACE,
} from "@/features/image-session/client-session/Utility.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { ImageGroup } from "@/features/image-session/client-session/ImageGroup.jsx";
import { getCachedStepData } from "@/features/image-session/client-session/helpers.js";

export function Images({
  session,
  handleBack,
  disabled,
  nextStatus,
  onUpdate,
}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);

  const { loading: toastLoading, setLoading: setToastLoading } =
    useToastContext();
  const { lng } = useLanguageSwitcherContext();
  const cardsRef = useRef([]);

  const handleImageSelect = (image, isSelected) => {
    setSelectedImages((old) =>
      isSelected ? old.filter((img) => img.id !== image.id) : [...old, image]
    );
  };

  async function getImages() {
    const spaceIds = session.selectedSpaces.map((space) => space.space.id);
    await getCachedStepData({
      url: `client/image-session/images?styleId=${
        session.styleId
      }&spaceIds=${spaceIds.join(",")}&`,
      setLoading,
      setData: setImages,
    });
  }

  useEffect(() => {
    getImages();
  }, [lng]);

  async function handleSaveImages() {
    const req = await handleRequestSubmit(
      { session, selectedImages, status: nextStatus },
      setToastLoading,
      `client/image-session/images`,
      false,
      "Saving your choice please wait..."
    );
    if (req.status === 200) {
      await onUpdate();
    }
  }

  return (
    <Box sx={{ pb: STEP_ACTION_BAR_SPACE }}>
      {loading && <FullScreenLoader />}

      <ImageGroup
        images={images}
        loadingImages={loading}
        type={"SELECT"}
        selectedImages={selectedImages}
        cardsRef={cardsRef}
        hidetitle={true}
        handleImageSelect={handleImageSelect}
      />

      <StepActionBar>
        <StepNav
          onBack={handleBack}
          onNext={selectedImages.length > 0 ? handleSaveImages : undefined}
          backDisabled={disabled}
          disabled={toastLoading}
        />
      </StepActionBar>
    </Box>
  );
}

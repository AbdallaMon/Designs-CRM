"use client";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { useEffect, useState, useRef, useCallback } from "react";
import { PreviewItem } from "./PreviewItem";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import { Box, Grid2 as Grid, Typography } from "@mui/material";
import { FloatingActionButton } from "./Utility";
import { gsap } from "gsap";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { ImageGroup } from "./ImageGroup";
import { debounce } from "lodash";

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
  const [isDebouncing, setIsDebouncing] = useState(false);

  const { loading: toastLoading, setLoading: setToastLoading } =
    useToastContext();
  const { lng } = useLanguageSwitcherContext();
  const cardsRef = useRef([]);
  const debouncedSelect = useRef();

  useEffect(() => {
    debouncedSelect.current = debounce((image, isSelected) => {
      setSelectedImages((old) =>
        isSelected ? old.filter((img) => img.id !== image.id) : [...old, image]
      );
      setIsDebouncing(false); // done
    }, 100);
  }, []);

  const handleImageSelect = (image, isSelected) => {
    setIsDebouncing(true);
    debouncedSelect.current(image, isSelected);
  };
  async function getImages() {
    const spaceIds = session.selectedSpaces.map((space) => {
      return space.space.id;
    });

    await getDataAndSet({
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
    <>
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
      <Box
        sx={{
          pt: 2,
        }}
      >
        {selectedImages && selectedImages.length > 0 ? (
          <>
            <FloatingActionButton
              disabled={toastLoading || isDebouncing}
              handleClick={handleSaveImages}
              type="NEXT"
              isText={true}
              label={lng === "ar" ? "التالي" : "Next"}
            />
            <FloatingActionButton
              disabled={disabled}
              handleClick={handleBack}
              type="BACK"
              sx={{ position: "fixed", bottom: "15px", left: "15px" }}
            />
          </>
        ) : (
          <FloatingActionButton
            disabled={disabled}
            handleClick={handleBack}
            type="BACK"
          />
        )}
      </Box>
    </>
  );
}

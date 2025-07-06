"use client";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { useEffect, useState, useRef } from "react";
import { PreviewItem } from "./PreviewItem";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import { Box, Grid2 as Grid, Typography } from "@mui/material";
import { FloatingActionButton } from "./Utility";
import { gsap } from "gsap";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { ImageGroup } from "./ImageGroup";

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
  const titleRef = useRef(null);
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
  useEffect(() => {
    if (images.length > 0 && !loading) {
      // Create a timeline for better control
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Set initial states with more dramatic effects
      gsap.set(cardsRef.current, {
        opacity: 0,
        y: 60,
        scale: 0.8,
        rotationX: 15,
        filter: "blur(8px) brightness(0.7)",
        transformOrigin: "center bottom",
      });

      // Enhanced title animation with micro-interactions
      tl.fromTo(
        titleRef.current,
        {
          opacity: 0,
          y: -30,
          scale: 0.9,
          filter: "blur(3px)",
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.5,
          ease: "back.out(1.7)",
        }
      );

      tl.to(
        cardsRef.current,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          filter: "blur(0px) brightness(1)",
          duration: 0.6,
          stagger: {
            amount: 0.2,
            from: "start",
            ease: "power2.out",
          },
          ease: "back.out(1.2)",
        },
        "-=0.2"
      );

      return () => {
        tl.kill();
      };
    }
  }, [images, loading]);
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
  const title = lng === "ar" ? "اختر التصاميم" : "Choose a designs";

  return (
    <>
      {loading && <FullScreenLoader />}
      <Typography
        ref={titleRef}
        variant="h4"
        color="primary"
        sx={{ my: 2, textAlign: "center !important", px: 1 }}
      >
        {title}
      </Typography>

      <ImageGroup
        images={images}
        loadingImages={loading}
        type={"SELECT"}
        selectedImages={selectedImages}
        cardsRef={cardsRef}
        handleImageSelect={(image, isSelected) => {
          if (isSelected) {
            setSelectedImages((old) =>
              old.filter((img) => img.id !== image.id)
            );
          } else {
            setSelectedImages((old) => [...old, image]);
          }
        }}
      />
      <Box
        sx={{
          pt: 2,
        }}
      >
        {selectedImages && selectedImages.length > 0 ? (
          <>
            <FloatingActionButton
              disabled={toastLoading}
              handleClick={handleSaveImages}
              type="NEXT"
              isText={true}
              label={lng === "ar" ? "التالي" : "Next"}
            />
            <FloatingActionButton
              disabled={disabled}
              handleClick={handleBack}
              type="BACK"
              sx={{ position: "fixed", bottom: "15px", right: "15px" }}
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

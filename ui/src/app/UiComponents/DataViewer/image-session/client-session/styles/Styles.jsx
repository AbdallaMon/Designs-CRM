"use client";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { useEffect, useState, useRef } from "react";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import { Box, Grid2 as Grid, Typography } from "@mui/material";
import { gsap } from "gsap";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { FloatingActionButton } from "../Utility";
import { PreviewItemDialog } from "../shared/PreviewItemDialog";
import { SharedCardItem } from "../shared/SharedCardItem";

export function Styles({
  session,
  handleBack,
  disabled,
  nextStatus,
  onUpdate,
}) {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(false);
  const { loading: toastLoading, setLoading: setToastLoading } =
    useToastContext();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const handlePreviewOpen = (startIndex) => {
    setCurrentPreviewIndex(startIndex);
    setPreviewOpen(true);
  };

  const { lng } = useLanguageSwitcherContext();
  const cardsRef = useRef([]);
  const containerRef = useRef(null);
  async function getStyles() {
    await getDataAndSet({
      url: `client/image-session/styles?lng=${lng}&`,
      setLoading,
      setData: setStyles,
    });
  }

  useEffect(() => {
    getStyles();
  }, [lng]);
  useEffect(() => {
    if (styles.length > 0 && !loading) {
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

      // Modern card entrance with layered effects
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
  }, [styles, loading]);

  async function handleStyleSubmit() {
    const req = await handleRequestSubmit(
      { session, selectedStyle, status: nextStatus },
      setToastLoading,
      `client/image-session/styles`,
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
      <PreviewItemDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        items={styles}
        currentIndex={currentPreviewIndex}
        onIndexChange={setCurrentPreviewIndex}
        selectedItems={selectedStyle ? [selectedStyle] : []}
        type={"SELECT"}
        itemType="STYLE"
        onItemSelect={(style) => {
          if (selectedStyle && selectedStyle.id === style.id) {
            setSelectedStyle(null);
          } else {
            setSelectedStyle(style);
          }
        }}
      />

      <Grid container ref={containerRef}>
        {styles.map((style, index) => {
          return (
            <Grid
              size={12}
              key={style.id}
              ref={(el) => (cardsRef.current[index] = el)}
              sx={{
                opacity: 0,

                cursor: "pointer",
                transition: "transform 0.2s ease",
                "& .MuiPaper-root": {
                  height: "100%",
                },
                overflow: "hidden",
                maxHeight: "300px",
                position: "relative",
              }}
            >
              <SharedCardItem
                item={style}
                template={style.template}
                type={"MATERIAL"}
                canSelect={true}
                isFullWidth={false}
                canPreview={true}
                handlePreviewClick={() => {
                  handlePreviewOpen(index);
                }}
                height={"300px"}
                isSelected={selectedStyle?.id === style.id}
                onSelect={() => {
                  if (selectedStyle && selectedStyle.id === style.id) {
                    setSelectedStyle(null);
                  } else {
                    setSelectedStyle(style);
                  }
                }}
              />
            </Grid>
          );
        })}
      </Grid>
      <Box
        sx={{
          pt: 2,
        }}
      >
        {selectedStyle ? (
          <>
            <FloatingActionButton
              disabled={toastLoading}
              handleClick={handleStyleSubmit}
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

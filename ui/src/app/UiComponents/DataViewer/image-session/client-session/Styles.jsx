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
  const { lng } = useLanguageSwitcherContext();
  const cardsRef = useRef([]);
  const titleRef = useRef(null);
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
  const title = lng === "ar" ? "اختر النمط" : "Choose a style";

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

      <Grid container ref={containerRef}>
        {styles.map((style, index) => {
          return (
            <Grid
              size={{ xs: 12, md: 6 }}
              key={style.id}
              ref={(el) => (cardsRef.current[index] = el)}
              sx={{
                cursor: "pointer",
                transition: "transform 0.2s ease",
                opacity: 0,
                "& .MuiPaper-root": {
                  height: "100%",
                },
              }}
            >
              <PreviewItem
                item={style}
                template={style.template}
                type={"STYLE"}
                canSelect={true}
                extraLng={lng}
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

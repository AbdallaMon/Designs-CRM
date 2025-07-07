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

export function ColorPalletes({
  session,
  handleBack,
  disabled,
  nextStatus,
  onUpdate,
}) {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(false);
  const [customColors, setCustomColors] = useState([]);
  const [currentCard, setCurrentCard] = useState();
  const { loading: toastLoading, setLoading: setToastLoading } =
    useToastContext();
  const { lng } = useLanguageSwitcherContext();
  const cardsRef = useRef([]);
  const titleRef = useRef(null);
  const containerRef = useRef(null);
  async function getColorsPalletes() {
    await getDataAndSet({
      url: `client/image-session/colors?lng=${lng}&`,
      setLoading,
      setData: setColors,
    });
  }

  useEffect(() => {
    getColorsPalletes();
  }, [lng]);

  // Animate cards on enter
  useEffect(() => {
    if (colors.length > 0 && !loading) {
      // Reset cards to initial state
      gsap.set(cardsRef.current, {
        opacity: 0,
        y: 50,
        scale: 0.8,
        rotateX: 15,
      });

      // Animate title first
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: -30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        }
      );

      // Animate cards with stagger
      gsap.to(cardsRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.7)",
        delay: 0.3,
      });
    }
  }, [colors, loading]);

  function handleClickAnimationBack() {
    setSelectedColor(null);
    setCustomColors(null);
    const timeline = gsap.timeline();
    const paper = currentCard.querySelector(".MuiPaper-root");
    const rect = currentCard.getBoundingClientRect();
    const x = rect.left;
    const y = rect.top;
    const width = rect.width;
    const height = rect.height;
    const colorsSizes = paper.querySelectorAll(".color-circle");
    const colorSizeRect = colorsSizes[0].getBoundingClientRect();
    timeline.fromTo(
      colorsSizes,
      {
        opacity: 1,
        y: 0,
      },
      {
        opacity: 0,
        y: 15,
        duration: 0.3,
        ease: "power2.out",
        stagger: 0.05,
      }
    );
    timeline.fromTo(
      paper.querySelector("h5"),
      {
        opacity: 1,
        y: 0,
      },
      {
        opacity: 0,
        y: -15,
        duration: 0.3,
        ease: "power2.out",
        stagger: 0.05,
      },
      "<"
    );
    timeline.fromTo(
      paper,
      { left: 0, top: 0 },
      {
        delay: 0.5,
        duration: 0.5,
        ease: "power2.out",
        left: x,
        top: y,
        width: width,
        height: height,
      }
    );
    timeline.set(paper, {
      clearProps: "position,width,height,top,left,z-index",
    });
    timeline.set(currentCard, {
      clearProps: "width,height",
    });
    timeline.fromTo(
      colorsSizes,
      {
        opacity: 0,
        y: 15,
        width: colorSizeRect.width,
        height: colorSizeRect.height,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
        stagger: 0.05,
        width: colorSizeRect.width - 5,
        height: colorSizeRect.height - 5,
      }
    );
    timeline.fromTo(
      paper.querySelector("h5"),
      {
        opacity: 0,
        y: -15,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        stagger: 0.05,
      },
      "<"
    );
    setCurrentCard(null);
  }

  const handleCardClick = (index, cardElement, color) => {
    if (currentCard) {
      return;
    }
    setSelectedColor(color);
    setCustomColors(color.colors);
    const timeline = gsap.timeline();
    const paper = cardElement.querySelector(".MuiPaper-root");
    const rect = paper.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const cardRect = cardElement.getBoundingClientRect();
    const cardHeight = cardRect.height;
    const colorsSizes = paper.querySelectorAll(".color-circle");
    const colorSizeRect = colorsSizes[0].getBoundingClientRect();

    timeline.set(cardElement, {
      clearProps: "transform",
      height: cardHeight,
    });

    timeline.set(paper, {
      width: width,
      height: height,
      zIndex: 100,
      position: "fixed",
    });
    timeline.fromTo(
      colorsSizes,
      {
        opacity: 1,
        y: 0,
      },
      {
        y: 15,
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
        stagger: 0.05,
      }
    );
    timeline.fromTo(
      paper.querySelector("h5"),
      {
        opacity: 1,
        y: 0,
      },
      {
        opacity: 0,
        y: -15,
        duration: 0.3,
        ease: "power2.out",
        stagger: 0.05,
      },
      "<"
    );
    // return;
    timeline.to(paper, {
      delay: 0.5,
      duration: 0.5,
      ease: "power2.out",
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
    });

    timeline.fromTo(
      colorsSizes,
      {
        opacity: 0,
        y: 15,
        width: colorSizeRect.width,
        height: colorSizeRect.height,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
        stagger: 0.05,
        width: colorSizeRect.width + 5,
        height: colorSizeRect.height + 5,
      }
    );
    timeline.fromTo(
      paper.querySelector("h5"),
      {
        opacity: 0,
        y: -15,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        stagger: 0.05,
      },
      "<"
    );
    setCurrentCard(cardElement);
  };

  async function handleSubmitColor() {
    const req = await handleRequestSubmit(
      { session, customColors, selectedColor, status: nextStatus },
      setToastLoading,
      `client/image-session/colors`,
      false,
      "Saving your choice please wait..."
    );
    if (req.status === 200) {
      await onUpdate();
    }
  }
  const title =
    lng === "ar"
      ? "اختر نمط الألوان المفضل لديك"
      : "Choose your preferred color pattern";

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
      {currentCard && (
        <FloatingActionButton
          disabled={disabled}
          handleClick={handleClickAnimationBack}
          type="BACK"
          sx={{ position: "fixed", top: "15px", left: "15px" }}
        />
      )}
      <Grid container ref={containerRef}>
        {colors.map((color, index) => {
          return (
            <Grid
              size={color.isFullWidth ? 12 : 6}
              key={color.id}
              ref={(el) => (cardsRef.current[index] = el)}
              onClick={() =>
                handleCardClick(index, cardsRef.current[index], color)
              }
              sx={{
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}
            >
              <PreviewItem
                customColors={customColors}
                setCustomColors={setCustomColors}
                item={color}
                template={color.template}
                isEditMode={
                  customColors &&
                  customColors.length > 0 &&
                  selectedColor.id === color.id
                }
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
        {selectedColor ? (
          <FloatingActionButton
            disabled={toastLoading}
            handleClick={handleSubmitColor}
            type="NEXT"
            isText={true}
            label={lng === "ar" ? "التالي" : "Next"}
          />
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

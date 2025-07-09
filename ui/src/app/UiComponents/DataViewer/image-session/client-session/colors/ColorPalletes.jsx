"use client";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { useEffect, useState, useRef } from "react";
import { PreviewItem } from "../PreviewItem";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import {
  Box,
  Card,
  CardContent,
  Grid2 as Grid,
  Typography,
} from "@mui/material";
import { FloatingActionButton } from "../Utility";
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
  const [isFullWidth, setIsFullWidth] = useState(false);
  const { loading: toastLoading, setLoading: setToastLoading } =
    useToastContext();
  const { lng } = useLanguageSwitcherContext();
  const cardsRef = useRef([]);
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
    const paper = currentCard.querySelector(".color-card .MuiPaper-root");
    const rect = currentCard.getBoundingClientRect();
    const x = rect.left;
    const y = rect.top;
    const width = rect.width;
    const height = rect.height;
    const colorsSizes = paper.querySelectorAll(".color-circle");
    const colorSizeRect =
      colorsSizes &&
      colorsSizes.length > 0 &&
      colorsSizes[0].getBoundingClientRect();
    if (colorSizeRect) {
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
    }
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
    const description = paper.querySelector(".description");
    if (description) {
      timeline.fromTo(
        description,
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
        },
        "<"
      );
    }
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
    // if (colorSizeRect) {
    //   timeline.fromTo(
    //     colorsSizes,
    //     {
    //       opacity: 0,
    //       y: 15,
    //       width: colorSizeRect.width,
    //       height: colorSizeRect.height,
    //     },
    //     {
    //       y: 0,
    //       opacity: 1,
    //       duration: 0.3,
    //       ease: "power2.out",
    //       stagger: 0.05,
    //       width: colorSizeRect.width - 5,
    //       height: colorSizeRect.height - 5,
    //     }
    //   );
    // }
    // timeline.fromTo(
    //   paper.querySelector("h5"),
    //   {
    //     opacity: 0,
    //     y: -15,
    //   },
    //   {
    //     opacity: 1,
    //     y: 0,
    //     duration: 0.3,
    //     ease: "power2.out",
    //     stagger: 0.05,
    //   },
    //   "<"
    // );
    if (isFullWidth) {
      timeline.to(paper, {
        y: "100%",
      });
    } else {
      timeline.to(paper, {
        x: "100%",
      });
    }
    timeline.eventCallback("onComplete", () => {
      console.log("what?");
      gsap.set(currentCard.querySelector(".color-card"), {
        zIndex: -1,
      });
      setCurrentCard(null);
    });
  }

  const handleCardClick = (index, cardElement, color, isFullWidth) => {
    if (currentCard) {
      return;
    }
    setIsFullWidth(isFullWidth);
    setSelectedColor(color);
    setCustomColors(color.colors);
    const timeline = gsap.timeline();
    const paper = cardElement.querySelector(".color-card .MuiPaper-root");
    const rect = paper.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const cardRect = cardElement.getBoundingClientRect();
    const cardHeight = cardRect.height;
    const colorsSizes = paper.querySelectorAll(".color-circle");
    const colorSizeRect =
      colorsSizes &&
      colorsSizes.length > 0 &&
      colorsSizes[0].getBoundingClientRect();

    timeline.set(cardElement, {
      clearProps: "transform",
      height: cardHeight,
      opacity: 1,
    });
    timeline.set(cardElement.querySelector(".color-card"), {
      zIndex: 10,
    });

    timeline.set(paper, {
      width: width,
      height: height,
      zIndex: 100,
      position: "fixed",
      left: cardRect.left,
      top: cardRect.top,
      ...(isFullWidth ? { y: "100%" } : { x: "100%" }),
    });
    timeline.to(paper, {
      ...(isFullWidth ? { y: 0 } : { x: 0 }),
    });
    // if (colorSizeRect) {
    //   timeline.fromTo(
    //     colorsSizes,
    //     {
    //       opacity: 1,
    //       y: 0,
    //     },
    //     {
    //       y: 15,
    //       opacity: 0,
    //       duration: 0.3,
    //       ease: "power2.out",
    //       stagger: 0.05,
    //     }
    //   );
    // }
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
    if (colorSizeRect) {
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
    }
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
    const description = paper.querySelector(".description");
    if (description) {
      timeline.fromTo(
        description,
        {
          opacity: 0,
          y: 15,
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
    }
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
          let isFullWidth = false;

          if (index === 0) {
            isFullWidth = true;
          } else {
            const indexInGrid = index - 1;
            const isLast = index === colors.length - 1;
            const isFirstInRow = indexInGrid % 2 === 0;

            if (isLast && isFirstInRow) {
              isFullWidth = true;
            }
          }
          return (
            <Grid
              size={isFullWidth ? 12 : 6}
              key={color.id}
              ref={(el) => (cardsRef.current[index] = el)}
              onClick={() =>
                handleCardClick(
                  index,
                  cardsRef.current[index],
                  color,
                  isFullWidth
                )
              }
              sx={{
                cursor: "pointer",
                transition: "transform 0.2s ease",
                overflow: "hidden",
                opacity: 0,

                maxHeight: "300px",
                position: "relative",
              }}
            >
              <ColorPalleteItem color={color} isFullWidth={isFullWidth} />
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: " 100%",
                  zIndex: -1,
                }}
                className="color-card"
              >
                <PreviewItem
                  customColors={customColors}
                  setCustomColors={setCustomColors}
                  item={color}
                  template={color.template}
                  currentCard={currentCard}
                  height={"300px"}
                  animated={
                    selectedColor &&
                    !selectedColor.template.showColors &&
                    customColors &&
                    customColors.length > 0 &&
                    selectedColor.id === color.id
                  }
                  isEditMode={
                    customColors &&
                    customColors.length > 0 &&
                    selectedColor.id === color.id
                  }
                />
              </Box>
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

function ColorPalleteItem({ color, isFullWidth }) {
  const [word1, word2] = color.title[0].text.split(" ");
  return (
    <Card
      sx={{
        backgroundColor: color.background,
        maxHeight: "400px",
        minHeight: "300px",
        height: "100%",
        position: "relative",
        display: "flex",
        justifyContent: isFullWidth ? "center" : "flex-end",
        alignItems: isFullWidth ? "center" : "flex-end",
        px: 2,
        pb: 2,
        borderRadius: 0,
      }}
    >
      <CardContent
        sx={{
          position: "absolute",
          bottom: isFullWidth ? "50%" : 16,
          left: isFullWidth ? "50%" : 16,
          transform: isFullWidth ? "translate(-50%, 50%)" : "none",
          textAlign: isFullWidth ? "center" : "right",
        }}
      >
        {isFullWidth ? (
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              color: "#fff",
              fontSize: "1.6rem",
              lineHeight: 1.3,
            }}
          >
            {word1} {word2}
          </Typography>
        ) : (
          <>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#fff",
                fontSize: "1.6rem",
                lineHeight: 1.3,
              }}
            >
              {word1}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#fff",
                fontSize: "1.6rem",
                lineHeight: 1.3,
              }}
            >
              {word2}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}

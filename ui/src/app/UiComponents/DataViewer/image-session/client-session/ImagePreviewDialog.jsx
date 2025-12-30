import {
  Backdrop,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Slide,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  MdCheckCircle,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdRadioButtonUnchecked,
} from "react-icons/md";
import { NotesComponent } from "../../utility/Notes";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { ensureHttps } from "@/app/helpers/functions/utility";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function ImagePreviewDialog({
  open,
  onClose,
  images,
  currentIndex,
  onIndexChange,
  selectedImages,
  onImageSelect,
  type = "SELECT",
}) {
  const getVisiblePages = (current, total, maxVisible = 7) => {
    if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i);

    const halfVisible = Math.floor(maxVisible / 2);
    let start = Math.max(0, current - halfVisible);
    let end = Math.min(total - 1, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  const DOTS_PER_PAGE = 10;
  const currentPage = Math.floor(currentIndex / DOTS_PER_PAGE);
  const totalPages = Math.ceil(images.length / DOTS_PER_PAGE);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const currentImage = images[currentIndex];
  const isSelected = selectedImages?.find((img) => img.id === currentImage?.id);
  const photo = type === "SELECT" ? currentImage : currentImage?.designImage;

  const { lng } = useLanguageSwitcherContext();
  const UI_TEXT = {
    SWIPE_NAV_HINT: {
      en: "Swipe left/right to navigate • Tap indicators to jump",
      ar: "اسحب لليسار أو اليمين للتنقل • اضغط على النقاط للانتقال السريع",
    },
    SELECT_IMAGE_LABEL: {
      en: (isSelected) => (isSelected ? "Selected" : "Select Image"),
      ar: (isSelected) => (isSelected ? "تم التحديد" : "اختر الصورة"),
    },
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  // Touch swipe handling for mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < images.length - 1) handleNext();
    if (isRightSwipe && currentIndex > 0) handlePrev();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (type !== "SELECT") return;
      if (!open) return;
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") onClose();
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onImageSelect(currentImage);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [open, currentIndex, currentImage, onImageSelect, onClose]);

  if (!currentImage) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen={isMobile}
      TransitionComponent={Transition}
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          sx: { bgcolor: "rgba(0, 0, 0, 0.95)", backdropFilter: "blur(4px)" },
        },
      }}
      PaperProps={{
        sx: {
          bgcolor: "transparent",
          boxShadow: "none",
          m: isMobile ? 0 : 2,
          maxHeight: isMobile ? "100vh" : "calc(100vh - 32px)",
          width: isMobile ? "100vw" : "calc(100vw - 32px)",
          borderRadius: isMobile ? 0 : 2,
          overflow: "hidden",
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          bgcolor: "rgba(0, 0, 0, 0.9)",
          color: "white",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Header */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)",
            p: { xs: 2, md: 3 },
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
            {currentIndex + 1} of {images.length}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              color: "white",
              bgcolor: "rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }}
          >
            <MdClose />
          </IconButton>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            p: { xs: 1, md: 2 },
            py: { md: 8 },
          }}
        >
          <Box
            component="img"
            src={ensureHttps(photo.imageUrl)}
            alt={`Image ${currentImage.id}`}
            sx={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              userSelect: "none",
              transition: "transform 0.3s ease",
              borderRadius: 1,
              boxShadow: 3,
            }}
          />

          {!isMobile && images.length > 1 && (
            <>
              <IconButton
                onClick={handlePrev}
                disabled={currentIndex === 0}
                sx={{
                  position: "absolute",
                  left: lng === "ar" ? "unset" : 16,
                  right: lng === "ar" ? 16 : "unset",

                  bgcolor: "rgba(0,0,0,0.6)",
                  color: "white",
                  width: 56,
                  height: 56,
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.8)",
                    transform: "scale(1.1)",
                  },
                  "&:disabled": {
                    bgcolor: "rgba(0,0,0,0.3)",
                    color: "rgba(255,255,255,0.3)",
                  },
                }}
              >
                <MdChevronLeft size={28} />
              </IconButton>

              <IconButton
                onClick={handleNext}
                disabled={currentIndex === images.length - 1}
                sx={{
                  position: "absolute",
                  right: lng === "ar" ? "unset" : 16,
                  left: lng === "ar" ? 16 : "unset",
                  bgcolor: "rgba(0,0,0,0.6)",
                  color: "white",
                  width: 56,
                  height: 56,
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.8)",
                    transform: "scale(1.1)",
                  },
                  "&:disabled": {
                    bgcolor: "rgba(0,0,0,0.3)",
                    color: "rgba(255,255,255,0.3)",
                  },
                }}
              >
                <MdChevronRight size={28} />
              </IconButton>
            </>
          )}
        </Box>

        {/* Bottom controls */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background:
              "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)",
            p: { xs: 2, md: 3 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          {images.length > 1 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              {/* Page navigation */}
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                {/* <IconButton
                  color="primary"
                  onClick={() =>
                    onIndexChange(
                      Math.max(0, (currentPage - 1) * DOTS_PER_PAGE)
                    )
                  }
                  disabled={currentPage === 0}
                >
                  <MdChevronLeft />
                </IconButton> */}
                <Typography variant="caption">
                  Page {currentPage + 1} of {totalPages}
                </Typography>
                {/* <IconButton
                  color="primary"
                  onClick={() =>
                    onIndexChange(
                      Math.min(
                        images.length - 1,
                        (currentPage + 1) * DOTS_PER_PAGE
                      )
                    )
                  }
                  disabled={currentPage === totalPages - 1}
                >
                  <MdChevronRight />
                </IconButton> */}
              </Box>

              {/* Dots for current page */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {images
                  .slice(
                    currentPage * DOTS_PER_PAGE,
                    (currentPage + 1) * DOTS_PER_PAGE
                  )
                  .map((_, index) => {
                    const actualIndex = currentPage * DOTS_PER_PAGE + index;
                    return (
                      <Box
                        key={actualIndex}
                        onClick={() => onIndexChange(actualIndex)}
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor:
                            actualIndex === currentIndex
                              ? "white"
                              : "rgba(255,255,255,0.3)",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            bgcolor:
                              actualIndex === currentIndex
                                ? "white"
                                : "rgba(255,255,255,0.6)",
                            transform: "scale(1.2)",
                          },
                        }}
                      />
                    );
                  })}
              </Box>
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {type === "SELECT" ? (
              <Button
                variant={isSelected ? "contained" : "outlined"}
                color={isSelected ? "success" : "primary"}
                startIcon={
                  isSelected ? <MdCheckCircle /> : <MdRadioButtonUnchecked />
                }
                onClick={() => onImageSelect(currentImage, isSelected)}
                sx={{
                  borderColor: "white",
                  color: isSelected ? "white" : "white",
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  "&:hover": {
                    borderColor: "white",
                    bgcolor: isSelected
                      ? "success.dark"
                      : "rgba(255,255,255,0.1)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                {UI_TEXT.SELECT_IMAGE_LABEL[lng](isSelected)}
              </Button>
            ) : (
              <NotesComponent
                id={currentImage.id}
                idKey="selectedImageId"
                slug="client"
                text={lng === "ar" ? "اضف ملاحظة للتصميم" : "Add note for this"}
              />
            )}
          </Box>

          {/* Mobile navigation hints */}
          {isMobile && images.length > 1 && (
            <Typography
              variant="caption"
              sx={{
                textAlign: "center",
                color: "rgba(255,255,255,0.8)",
                fontSize: 12,
              }}
            >
              <Typography>{UI_TEXT.SWIPE_NAV_HINT[lng]}</Typography>
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

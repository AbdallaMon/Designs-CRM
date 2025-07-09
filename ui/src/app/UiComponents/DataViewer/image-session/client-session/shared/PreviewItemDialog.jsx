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
  Chip,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  MdCheckCircle,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdRadioButtonUnchecked,
  MdThumbUp,
  MdThumbDown,
} from "react-icons/md";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { ensureHttps } from "@/app/helpers/functions/utility";
import ProsAndConsDialogButton from "../../admin/shared/ProsAndCons";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function PreviewItemDialog({
  open,
  onClose,
  items,
  currentIndex,
  onIndexChange,
  selectedItems,
  onItemSelect,
  type = "SELECT",
  itemType,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const currentItem =
    (currentIndex || currentIndex === 0) && items[currentIndex];
  const isSelected = selectedItems?.find((item) => item.id === currentItem?.id);

  const { lng } = useLanguageSwitcherContext();
  const UI_TEXT = {
    SWIPE_NAV_HINT: {
      en: "Swipe left/right to navigate • Tap indicators to jump",
      ar: "اسحب لليسار أو اليمين للتنقل • اضغط على النقاط للانتقال السريع",
    },
    SELECT_ITEM_LABEL: {
      en: (isSelected) => (isSelected ? "Selected" : "Select Item"),
      ar: (isSelected) => (isSelected ? "تم التحديد" : "اختر العنصر"),
    },
    PROS_LABEL: {
      en: "Pros",
      ar: "الإيجابيات",
    },
    CONS_LABEL: {
      en: "Pros & Cons",
      ar: "الايجابيات والسلبيات",
    },
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
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

    if (isLeftSwipe && currentIndex < items.length - 1) handleNext();
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
        onItemSelect(currentItem);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [open, currentIndex, currentItem, onItemSelect, onClose]);

  if (!currentItem) return null;

  const itemTitle = currentItem.title?.[0]?.text || "";
  const itemDescription =
    (currentItem.template.showDescription &&
      currentItem.description?.[0]?.content) ||
    "";

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
            {currentIndex + 1} of {items.length}
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

        {/* Main content area with image and overlay */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background image */}
          <Box
            component="img"
            src={ensureHttps(
              currentItem.imageUrl || currentItem.template.backgroundImage
            )}
            alt={itemTitle}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              userSelect: "none",
              filter: "brightness(0.7)",
            }}
          />

          {/* Content overlay */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.8) 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              p: { xs: 3, md: 4 },
              pb: { xs: 8, md: 10 },
              direction: lng === "ar" ? "ltr" : "ltr",
              "& .MuiTypography-root": {
                textAlign: lng === "ar" ? "left" : "left",
              },
              "& .MuiTypography-root": {
                textAlign: lng === "ar" ? "left" : "left",
              },
            }}
          >
            {/* Title */}
            {itemTitle && (
              <Typography
                variant={isMobile ? "h4" : "h3"}
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  mb: 2,
                  textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                  lineHeight: 1.2,
                }}
              >
                {itemTitle}
              </Typography>
            )}
            {/* Description */}
            {itemDescription && (
              <Typography
                variant="body1"
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  mb: 3,
                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  lineHeight: 1.6,
                  maxWidth: "800px",
                }}
              >
                {itemDescription}
              </Typography>
            )}
            {currentItem.template.showCons && (
              <ProsAndConsDialogButton
                materialId={itemType === "MATERIAL" && currentItem.id}
                styleId={itemType === "STYLE" && currentItem.id}
                lng={lng}
              />
            )}{" "}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                alignItems: "center",
                mt: 5,
                mb: 3,
              }}
            >
              {type === "SELECT" && (
                <Button
                  variant={isSelected ? "contained" : "outlined"}
                  color={isSelected ? "success" : "primary"}
                  startIcon={
                    isSelected ? <MdCheckCircle /> : <MdRadioButtonUnchecked />
                  }
                  onClick={() => onItemSelect(currentItem, isSelected)}
                  sx={{
                    borderColor: "white",
                    color: isSelected ? "white" : "white",
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: "bold",
                    textShadow: "none",
                    "&:hover": {
                      borderColor: "white",
                      bgcolor: isSelected
                        ? "success.dark"
                        : "rgba(255,255,255,0.1)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  {UI_TEXT.SELECT_ITEM_LABEL[lng](isSelected)}
                </Button>
              )}
            </Box>
          </Box>

          {!isMobile && items.length > 1 && (
            <>
              <IconButton
                onClick={handlePrev}
                disabled={currentIndex === 0}
                sx={{
                  position: "absolute",
                  left: lng === "ar" ? "unset" : 16,
                  right: lng === "ar" ? 16 : "unset",
                  top: "50%",
                  transform: "translateY(-50%)",
                  bgcolor: "rgba(0,0,0,0.6)",
                  color: "white",
                  width: 56,
                  height: 56,
                  zIndex: 100,
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.8)",
                    transform: "translateY(-50%) scale(1.1)",
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
                disabled={currentIndex === items.length - 1}
                sx={{
                  position: "absolute",
                  right: lng === "ar" ? "unset" : 16,
                  left: lng === "ar" ? 16 : "unset",
                  top: "50%",
                  transform: "translateY(-50%)",
                  bgcolor: "rgba(0,0,0,0.6)",
                  color: "white",
                  width: 56,
                  height: 56,
                  zIndex: 100,
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.8)",
                    transform: "translateY(-50%) scale(1.1)",
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

        {/* Bottom indicators and mobile hints */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            p: { xs: 2, md: 3 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          {items.length > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              {items.map((_, index) => (
                <Box
                  key={index}
                  onClick={() => onIndexChange(index)}
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor:
                      index === currentIndex
                        ? "white"
                        : "rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      bgcolor:
                        index === currentIndex
                          ? "white"
                          : "rgba(255,255,255,0.6)",
                      transform: "scale(1.2)",
                    },
                  }}
                />
              ))}
            </Box>
          )}

          {/* Mobile navigation hints */}
          {isMobile && items.length > 1 && (
            <Typography
              variant="caption"
              sx={{
                textAlign: "center",
                color: "rgba(255,255,255,0.8)",
                fontSize: 12,
              }}
            >
              {UI_TEXT.SWIPE_NAV_HINT[lng]}
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

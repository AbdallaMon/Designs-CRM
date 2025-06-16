import React, { useState, useRef, useEffect } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Typography,
  Grid2 as Grid,
  CardMedia,
  Card,
  Dialog,
  DialogContent,
  IconButton,
  Button,
  Fab,
  useTheme,
  useMediaQuery,
  Slide,
  Backdrop,
} from "@mui/material";
import {
  MdCheck,
  MdExpandMore,
  MdRoom,
  MdWarning,
  MdClose,
  MdFullscreen,
  MdChevronLeft,
  MdChevronRight,
  MdCheckCircle,
  MdRadioButtonUnchecked,
  MdZoomIn,
  MdAdd,
} from "react-icons/md";

// Transition component for dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function ImagePreviewDialog({
  open,
  onClose,
  images,
  currentIndex,
  onIndexChange,
  selectedImages,
  onImageSelect,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const currentImage = images[currentIndex];
  const isSelected = selectedImages.find((img) => img.id === currentImage?.id);

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

        {/* Main image container */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            p: { xs: 1, md: 2 },
          }}
        >
          <Box
            component="img"
            src={currentImage.url}
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

          {/* Navigation arrows for desktop */}
          {!isMobile && images.length > 1 && (
            <>
              <IconButton
                onClick={handlePrev}
                disabled={currentIndex === 0}
                sx={{
                  position: "absolute",
                  left: 16,
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
                  right: 16,
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
          {/* Image indicators */}
          {images.length > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              {images.map((_, index) => (
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

          {/* Action buttons */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Button
              variant={isSelected ? "contained" : "outlined"}
              color={isSelected ? "success" : "primary"}
              startIcon={
                isSelected ? <MdCheckCircle /> : <MdRadioButtonUnchecked />
              }
              onClick={() => onImageSelect(currentImage)}
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
              {isSelected ? "Selected" : "Select Image"}
            </Button>
          </Box>

          {/* Mobile navigation hints */}
          {isMobile && images.length > 1 && (
            <Typography
              variant="caption"
              sx={{
                textAlign: "center",
                color: "rgba(255,255,255,0.6)",
                fontSize: 12,
              }}
            >
              Swipe left/right to navigate • Tap indicators to jump
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export function ImageSelection({
  imagesBySpace,
  loadingImages = false,
  selectedImages = [],
  handleImageSelect = () => {},
  spaceRefs,
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handlePreviewOpen = (images, startIndex) => {
    setPreviewImages(images);
    setCurrentPreviewIndex(startIndex);
    setPreviewOpen(true);
  };

  const handleImageClick = (image, spaceImages) => {
    const imageIndex = spaceImages.findIndex((img) => img.id === image.id);
    handlePreviewOpen(spaceImages, imageIndex);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: "primary.main" }}
        >
          Select Images
        </Typography>
        <Chip
          label={`${selectedImages.length} selected`}
          color={selectedImages.length > 0 ? "primary" : "default"}
          variant={selectedImages.length > 0 ? "filled" : "outlined"}
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {loadingImages ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={48} />
        </Box>
      ) : (
        <Box>
          {imagesBySpace.map((spaceGroup, index) => {
            const selectedCount = spaceGroup.images.filter((img) =>
              selectedImages.find((selected) => selected.id === img.id)
            ).length;
            const hasSelection = selectedCount > 0;

            return (
              <Accordion
                key={spaceGroup.space.id}
                defaultExpanded={index === 0}
                ref={(el) => (spaceRefs.current[spaceGroup.space.id] = el)}
                sx={{
                  border: !hasSelection ? "2px solid" : "1px solid",
                  borderColor: !hasSelection ? "error.main" : "divider",
                  mb: 2,
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: 2,
                  "&:before": { display: "none" },
                  "&.Mui-expanded": {
                    border: !hasSelection ? "2px solid" : "1px solid",
                    borderColor: !hasSelection ? "error.main" : "primary.main",
                    boxShadow: 3,
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<MdExpandMore />}
                  sx={{
                    bgcolor: hasSelection ? "primary.50" : "background.paper",
                    "&:hover": {
                      bgcolor: hasSelection ? "primary.100" : "grey.50",
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    {spaceGroup.space.avatarUrl ? (
                      <Avatar
                        src={spaceGroup.space.avatarUrl}
                        alt={spaceGroup.space.name}
                        sx={{ width: 48, height: 48 }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: "primary.main",
                        }}
                      >
                        <MdRoom size={24} />
                      </Avatar>
                    )}

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {spaceGroup.space.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {spaceGroup.images.length} images available
                      </Typography>
                    </Box>

                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip
                        label={`${selectedCount}/${spaceGroup.images.length}`}
                        size="small"
                        color={hasSelection ? "primary" : "error"}
                        variant="outlined"
                      />

                      {!hasSelection && (
                        <Chip
                          label="Required"
                          size="small"
                          color="error"
                          icon={<MdWarning style={{ fontSize: 14 }} />}
                        />
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 2, bgcolor: "grey.50" }}>
                  <Grid container spacing={2}>
                    {spaceGroup.images.map((image) => {
                      const isSelected = selectedImages.find(
                        (img) => img.id === image.id
                      );
                      return (
                        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={image.id}>
                          <Card
                            sx={{
                              position: "relative",
                              borderRadius: 2,
                              overflow: "hidden",
                              boxShadow: isSelected ? 4 : 1,
                              border: isSelected ? 3 : 0,
                              borderColor: "primary.main",
                              transition:
                                "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: 4,
                              },
                            }}
                          >
                            <CardMedia
                              component="img"
                              height={isMobile ? 120 : 140}
                              image={image.url}
                              alt={`Image ${image.id}`}
                              sx={{
                                cursor: "pointer",
                                transition: "transform 0.3s ease",
                              }}
                              onClick={() =>
                                handleImageClick(image, spaceGroup.images)
                              }
                            />

                            {/* Selection overlay */}
                            <Box
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                bgcolor: isSelected
                                  ? "rgba(25, 118, 210, 0.15)"
                                  : "transparent",
                                transition: "all 0.3s ease",
                              }}
                            />

                            {/* Action buttons container */}
                            <Box
                              sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                              }}
                            >
                              {/* Preview button - Always visible */}
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageClick(image, spaceGroup.images);
                                }}
                                sx={{
                                  bgcolor: "rgba(0,0,0,0.7)",
                                  color: "white",
                                  width: 36,
                                  height: 36,
                                  transition: "all 0.3s ease",
                                  "&:hover": {
                                    bgcolor: "rgba(0,0,0,0.9)",
                                    transform: "scale(1.1)",
                                  },
                                }}
                                size="small"
                              >
                                <MdFullscreen size={18} />
                              </IconButton>

                              {/* Selection button - Always visible with better design */}
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageSelect(image);
                                }}
                                sx={{
                                  bgcolor: isSelected
                                    ? "rgba(76, 175, 80, 0.9)"
                                    : "rgba(255,255,255,0.9)",
                                  color: isSelected
                                    ? "white"
                                    : "rgba(0,0,0,0.7)",
                                  width: 36,
                                  height: 36,
                                  border: isSelected
                                    ? "2px solid #4caf50"
                                    : "2px solid rgba(0,0,0,0.2)",
                                  transition: "all 0.3s ease",
                                  "&:hover": {
                                    bgcolor: isSelected
                                      ? "rgba(76, 175, 80, 1)"
                                      : "rgba(255,255,255,1)",
                                    transform: "scale(1.1)",
                                    boxShadow: 3,
                                  },
                                }}
                                size="small"
                              >
                                {isSelected ? (
                                  <MdCheck size={18} />
                                ) : (
                                  <MdAdd size={18} />
                                )}
                              </IconButton>
                            </Box>

                            {/* Selection indicator badge */}
                            {isSelected && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  bottom: 8,
                                  left: 8,
                                  bgcolor: "success.main",
                                  color: "white",
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 2,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  boxShadow: 2,
                                }}
                              >
                                <MdCheckCircle size={14} />
                                Selected
                              </Box>
                            )}
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}

      <ImagePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        images={previewImages}
        currentIndex={currentPreviewIndex}
        onIndexChange={setCurrentPreviewIndex}
        selectedImages={selectedImages}
        onImageSelect={handleImageSelect}
      />
    </Box>
  );
}

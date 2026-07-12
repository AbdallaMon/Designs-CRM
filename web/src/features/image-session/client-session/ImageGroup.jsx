import React, { useState } from "react";
import { Box, Chip, CircularProgress, Typography, Grid, Alert } from "@mui/material";

import { ImageComponent } from "@/features/image-session/client-session/ImageComponent.jsx";
import { ImagePreviewDialog } from "@/features/image-session/client-session/ImagePreviewDialog.jsx";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";

// One rendering path for every dataset size. The old component had TWO scroll
// behaviors (a nested-`overflow:auto` virtual grid above 50 images, a normal
// grid below) plus a hand-rolled virtualizer whose hardcoded row height drifted
// against the real 280/300px cards and caused scroll jumps. We drop all of that:
// the page is the single scroll container, and image bytes stay cheap because
// each card's <img> is natively lazy-loaded (loading="lazy" in ImageLoader).
// The card wrapper divs are light, so even a few hundred render fine.
export function ImageGroup({
  images,
  loadingImages = false,
  selectedImages = [],
  handleImageSelect = () => {},
  type,
  cardsRef,
  hidetitle,
  canDelete,
  setImages,
  token,
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const handlePreviewOpen = (startIndex) => {
    setCurrentPreviewIndex(startIndex);
    setPreviewOpen(true);
  };

  const handleImageClick = (image) => {
    const imageIndex = images.findIndex((img) => img.id === image.id);
    handlePreviewOpen(imageIndex);
  };

  const { lng } = useLanguageSwitcherContext();
  const isSelectMode = type === "SELECT";

  const UI_TEXT = {
    SELECT_IMAGE_LABEL: {
      en: (isSelected) => (isSelected ? "Select images" : "Selected Images"),
      ar: (isSelected) => (isSelected ? "اختر الصور" : "الصور المختارة"),
    },
  };

  const safeImages = Array.isArray(images) ? images : [];

  return (
    <Box sx={{ pb: isSelectMode ? 0 : 5 }}>
      <Box sx={{ p: hidetitle ? 0 : { xs: 1, md: 2 } }}>
        {isSelectMode && !hidetitle && (
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
              {UI_TEXT.SELECT_IMAGE_LABEL[lng](isSelectMode)}
            </Typography>
            <Chip
              label={`${selectedImages.length} ${
                lng === "ar" ? "تم التحديد" : "selected"
              }`}
              color={selectedImages.length > 0 ? "primary" : "default"}
              variant={selectedImages.length > 0 ? "filled" : "outlined"}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        )}
      </Box>

      {!loadingImages &&
        safeImages.length === 0 &&
        type === "SELECT" && (
          <Box display="flex" justifyContent="center" p={4}>
            <Alert severity="error" color="error">
              {lng === "ar"
                ? "لا يوجد صور من فضلك اختر نمط اخر"
                : "No images found please chose different style"}
            </Alert>
          </Box>
        )}

      {loadingImages ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={48} />
        </Box>
      ) : (
        <Grid container spacing={0}>
          {safeImages.map((image, index) => {
            const isSelected = selectedImages.find(
              (img) => img.id === image.id
            );
            return (
              <Grid
                size={{ xs: 6, sm: 4, md: 3 }}
                key={image.id}
                ref={(el) =>
                  cardsRef ? (cardsRef.current[index] = el) : null
                }
              >
                <ImageComponent
                  image={image}
                  handleImageClick={handleImageClick}
                  isSelected={isSelected}
                  handleImageSelect={handleImageSelect}
                  type={type}
                  setImages={setImages}
                  canDelete={canDelete}
                  token={token}
                />
              </Grid>
            );
          })}
        </Grid>
      )}

      <ImagePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        images={safeImages}
        currentIndex={currentPreviewIndex}
        onIndexChange={setCurrentPreviewIndex}
        selectedImages={selectedImages}
        onImageSelect={handleImageSelect}
        type={type}
      />
    </Box>
  );
}

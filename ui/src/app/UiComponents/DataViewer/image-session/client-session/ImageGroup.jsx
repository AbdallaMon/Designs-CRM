import React, { useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Typography,
  Grid2 as Grid,
  Alert,
} from "@mui/material";

import { ImageComponent } from "./ImageComponent";
import { ImagePreviewDialog } from "./ImagePreviewDialog";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";

export function ImageGroup({
  images,
  loadingImages = false,
  selectedImages = [],
  handleImageSelect = () => {},
  type,
  cardsRef,
  hidetitle,
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
  const isSelected = type === "SELECT";
  const UI_TEXT = {
    SELECT_IMAGE_LABEL: {
      en: (isSelected) => (isSelected ? "Select images" : "Selectd Images"),
      ar: (isSelected) => (isSelected ? "الصور المختارة" : "اختر الصور"),
    },
  };

  return (
    <Box>
      <Box sx={{ p: hidetitle ? 0 : { xs: 1, md: 2 } }}>
        {isSelected && !hidetitle && (
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
              {UI_TEXT.SELECT_IMAGE_LABEL[lng](isSelected)}
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
      {!loadingImages && images && images.length === 0 && type === "SELECT" && (
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
        <Box>
          <Grid container spacing={0}>
            {images.map((image, index) => {
              const isSelected = selectedImages.find(
                (img) => img.id === image.id
              );
              return (
                <Grid
                  size={{ xs: 6, sm: 4, md: 3 }}
                  ref={(el) =>
                    cardsRef ? (cardsRef.current[index] = el) : null
                  }
                  sx={{
                    opacity: cardsRef ? 0 : 1,
                  }}
                  key={image.id}
                >
                  <ImageComponent
                    image={image}
                    handleImageClick={handleImageClick}
                    isSelected={isSelected}
                    handleImageSelect={handleImageSelect}
                    type={type}
                  />
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      <ImagePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        images={images}
        currentIndex={currentPreviewIndex}
        onIndexChange={setCurrentPreviewIndex}
        selectedImages={selectedImages}
        onImageSelect={handleImageSelect}
        type={type}
      />
    </Box>
  );
}

import React, { useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Typography,
  Grid2 as Grid,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import { ImageComponent } from "./ImageComponent";
import { ImagePreviewDialog } from "./ImagePreviewDialog";

export function ImageGroup({
  images,
  loadingImages = false,
  selectedImages = [],
  handleImageSelect = () => {},
  type,
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

  return (
    <Box>
      <Box sx={{ p: { xs: 1, md: 2 } }}>
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
            {type === "SELECT" ? "Select Images" : "Selected Images"}
          </Typography>
          <Chip
            label={`${selectedImages.length} selected`}
            color={selectedImages.length > 0 ? "primary" : "default"}
            variant={selectedImages.length > 0 ? "filled" : "outlined"}
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </Box>
      {loadingImages ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={48} />
        </Box>
      ) : (
        <Box>
          <Grid container spacing={2}>
            {images.map((image) => {
              const isSelected = selectedImages.find(
                (img) => img.id === image.id
              );
              return (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={image.id}>
                  <ImageComponent
                    image={image}
                    handleImageClick={handleImageClick}
                    isSelected={isSelected}
                    type={type}
                    handleImageSelect={handleImageSelect}
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

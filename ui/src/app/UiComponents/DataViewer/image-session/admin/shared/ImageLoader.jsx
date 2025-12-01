import React, { useState } from "react";
import { Box, Typography, Skeleton } from "@mui/material";

export const ImageLoader = ({
  src,
  alt,
  isArchived = false,
  width = "100%",
  height = "auto",
  skeletonHeight = 200,
  borderRadius = 2,
  overlayText = "ARCHIVED",
  style = {},
  onLoad,
  onError,
  ...props
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (onLoad) onLoad();
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
    if (onError) onError();
  };

  return (
    <Box position="relative" {...props}>
      {/* Loading Skeleton */}
      {!imageLoaded && (
        <Skeleton
          variant="rectangular"
          width={width}
          height={skeletonHeight}
          sx={{ borderRadius }}
          animation="wave"
        />
      )}

      {/* Error State */}
      {imageError ? (
        <Box
          sx={{
            width: width,
            height: skeletonHeight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "grey.100",
            borderRadius,
            border: "1px dashed #ccc",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Failed to load image
          </Typography>
        </Box>
      ) : (
        /* Image Container */
        <Box
          sx={{
            borderRadius,
            overflow: "hidden",
            position: "relative",
            display: imageLoaded ? "block" : "none",
          }}
        >
          <img
            src={src}
            alt={alt}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              width: width,
              height: height,
              display: "block",
              transition: "transform 0.3s ease",
              ...style,
            }}
          />

          {/* Overlay for archived/special states */}
          {isArchived && imageLoaded && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "rgba(0, 0, 0, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius,
              }}
            >
              <Typography
                variant="h6"
                color="white"
                sx={{ fontWeight: "bold" }}
              >
                {overlayText}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ImageLoader;

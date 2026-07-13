import React, { useState, useRef, useEffect } from "react";
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
  const imgRef = useRef(null);

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (onLoad) onLoad();
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
    if (onError) onError();
  };

  // A cached image can finish loading BEFORE React attaches onLoad — the event
  // then never fires and the skeleton spins forever. On mount / src change we
  // reset and synchronously check `img.complete`, so already-decoded images
  // reveal immediately instead of getting stuck.
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    const img = imgRef.current;
    if (img && img.complete) {
      if (img.naturalWidth > 0) handleImageLoad();
      else handleImageError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  if (imageError) {
    return (
      <Box position="relative" {...props}>
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
      </Box>
    );
  }

  return (
    <Box position="relative" {...props}>
      {/* The <img> stays in the layout at all times (never display:none) so
          native lazy-loading actually fires; the skeleton is overlaid on top
          and the image fades in once decoded. */}
      <Box
        sx={{
          borderRadius,
          overflow: "hidden",
          position: "relative",
          minHeight: imageLoaded ? undefined : skeletonHeight,
        }}
      >
        {!imageLoaded && (
          <Skeleton
            variant="rectangular"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              borderRadius,
              zIndex: 1,
            }}
            animation="wave"
          />
        )}

        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            width: width,
            height: height,
            display: "block",
            opacity: imageLoaded ? 1 : 0,
            transition: "opacity 0.3s ease",
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
            <Typography variant="h6" color="white" sx={{ fontWeight: "bold" }}>
              {overlayText}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ImageLoader;

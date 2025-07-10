import React, { useState, useEffect, useRef, useCallback } from "react";
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

// Virtual scrolling hook
const useVirtualScroll = (
  items,
  containerRef,
  itemHeight = 300,
  buffer = 5
) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const [containerHeight, setContainerHeight] = useState(0);

  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + clientHeight) / itemHeight) + buffer
    );

    setVisibleRange({ start, end });
  }, [items.length, itemHeight, buffer]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => updateVisibleRange();
    const handleResize = () => {
      setContainerHeight(container.clientHeight);
      updateVisibleRange();
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    // Initial setup
    handleResize();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateVisibleRange]);

  return { visibleRange, containerHeight };
};

// Intersection Observer hook for lazy loading
const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return [ref, isIntersecting];
};

// Lazy Image Component
const LazyImageComponent = ({
  image,
  handleImageClick,
  isSelected,
  handleImageSelect,
  type,
  index,
  canDelete,
  setImages,
}) => {
  const [ref, isIntersecting] = useIntersectionObserver();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (isIntersecting && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isIntersecting, hasLoaded]);

  return (
    <div ref={ref}>
      {hasLoaded ? (
        <ImageComponent
          image={image}
          handleImageClick={handleImageClick}
          isSelected={isSelected}
          handleImageSelect={handleImageSelect}
          type={type}
          setImages={setImages}
          canDelete={canDelete}
        />
      ) : (
        // Placeholder while loading
        <Box
          sx={{
            height: 300,
            bgcolor: "grey.100",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid",
            borderColor: "grey.300",
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}
    </div>
  );
};

// Virtual Grid Component
const VirtualGrid = ({
  images,
  selectedImages,
  handleImageSelect,
  handleImageClick,
  type,
  cardsRef,
  canDelete,
  setImages,
}) => {
  const containerRef = useRef(null);
  const itemsPerRow = 4; // Adjust based on your grid setup
  const itemHeight = 320; // Height including padding

  const { visibleRange } = useVirtualScroll(
    images,
    containerRef,
    itemHeight,
    20
  );

  const getVisibleItems = () => {
    const rows = Math.ceil(images.length / itemsPerRow);
    const visibleRows = [];

    for (
      let i = visibleRange.start;
      i < Math.min(visibleRange.end, rows);
      i++
    ) {
      const rowItems = [];
      for (let j = 0; j < itemsPerRow; j++) {
        const index = i * itemsPerRow + j;
        if (index < images.length) {
          rowItems.push({ image: images[index], index });
        }
      }
      visibleRows.push(rowItems);
    }

    return visibleRows;
  };

  const totalHeight = Math.ceil(images.length / itemsPerRow) * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <Box
      ref={containerRef}
      sx={{
        height: "100vh",
        overflow: "auto",
        position: "relative",
      }}
    >
      <Box sx={{ height: totalHeight, position: "relative" }}>
        <Box
          sx={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {getVisibleItems().map((row, rowIndex) => (
            <Grid container spacing={0} key={rowIndex + visibleRange.start}>
              {row.map(({ image, index }) => {
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
                    <LazyImageComponent
                      image={image}
                      handleImageClick={handleImageClick}
                      isSelected={isSelected}
                      handleImageSelect={handleImageSelect}
                      type={type}
                      index={index}
                      canDelete={canDelete}
                      setImages={setImages}
                    />
                  </Grid>
                );
              })}
            </Grid>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

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
      en: (isSelected) => (isSelected ? "Select images" : "Selected Images"),
      ar: (isSelected) => (isSelected ? "الصور المختارة" : "اختر الصور"),
    },
  };

  return (
    <Box sx={{ pb: isSelected ? 0 : 5 }}>
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
      ) : images.length > 50 ? (
        // Use virtual scrolling for large datasets
        <VirtualGrid
          images={images}
          selectedImages={selectedImages}
          handleImageSelect={handleImageSelect}
          handleImageClick={handleImageClick}
          type={type}
          cardsRef={cardsRef}
          canDelete={canDelete}
          setImages={setImages}
        />
      ) : (
        // Use regular grid for smaller datasets
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
                  // sx={{
                  //   opacity: cardsRef ? 0 : 1,
                  // }}
                  key={image.id}
                >
                  <LazyImageComponent
                    image={image}
                    handleImageClick={handleImageClick}
                    isSelected={isSelected}
                    handleImageSelect={handleImageSelect}
                    type={type}
                    index={index}
                    setImages={setImages}
                    canDelete={canDelete}
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

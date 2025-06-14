"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import { Box, Typography, useTheme } from "@mui/material";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";
import PaginationWithLimit from "@/app/UiComponents/DataViewer/PaginationWithLimit.jsx";

function LeadsSlider({
  title,
  children,
  loading,
  withPagination = true,
  total,
  limit,
  setPage,
  totalPages,
  page,
  setLimit,
  NextCalls,
  danger = false,
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        width: "100%",
        margin: "auto",
        py: 1,
        pb: NextCalls ? 1 : 3,
        background: danger ? "#e76764" : theme.palette.background.default,
        color: danger && "white",
        position: "relative",
        mb: 2,
        borderRadius: 3, // Rounded corners
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", // Subtle shadow
      }}
    >
      {loading && <LoadingOverlay />}
      <Typography variant="h5" sx={{ pl: 2, mb: 0.5 }}>
        {title}
      </Typography>
      <Swiper
        modules={[Navigation, Pagination, Scrollbar]}
        spaceBetween={30}
        navigation
        pagination={{ clickable: true }}
        scrollbar={{ draggable: true }}
        breakpoints={{
          0: {
            slidesPerView: 1,
            spaceBetween: 10,
          },
          320: {
            slidesPerView: 1.2,
            spaceBetween: 15,
          },
          480: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          640: {
            slidesPerView: 2.5,
            spaceBetween: 25,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 30,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 35,
          },
          1280: {
            slidesPerView: 4.5,
            spaceBetween: 40,
          },
          1600: {
            slidesPerView: 5,
            spaceBetween: 45,
          },
        }}
        style={{
          "--swiper-navigation-color": theme.palette.primary.main,
          "--swiper-pagination-color": theme.palette.primary.main,
          padding: NextCalls ? "20px 12px 35px" : "20px 12px 50px",
        }}
      >
        {children.map((child, index) => (
          <SwiperSlide key={index} style={{ width: "auto" }}>
            {child}
          </SwiperSlide>
        ))}
      </Swiper>
      {withPagination && (
        <PaginationWithLimit
          total={total}
          limit={limit}
          page={page}
          setLimit={setLimit}
          setPage={setPage}
          totalPages={totalPages}
        />
      )}
    </Box>
  );
}

export default LeadsSlider;

"use client";
import React from "react";
import { Box, Typography, Avatar, alpha } from "@mui/material";

const KeyMetricFinancialTile = ({ metric, isMobile }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        p: 2.5,
        height: "100%",
        boxShadow: 3,
        borderRadius: 2,
        bgcolor: "background.paper",
        borderInlineStart: 4,
        borderColor: metric.color,
        background: (t) =>
          `linear-gradient(135deg, ${alpha(
            metric.color,
            0.1
          )} 0%, ${t.palette.background.paper} 60%)`,
        transition: "transform 0.3s, box-shadow 0.3s",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: 8,
        },
      }}
    >
      <Avatar
        sx={{
          bgcolor: metric.color,
          width: 64,
          height: 64,
          marginInlineEnd: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {metric.icon}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
          {metric.title}
        </Typography>
        <Typography
          variant={isMobile ? "h6" : "h5"}
          sx={{
            fontWeight: "bold",
            color: "text.primary",
            wordBreak: "break-word",
          }}
        >
          {metric.value}
        </Typography>
      </Box>
    </Box>
  );
};

export default KeyMetricFinancialTile;

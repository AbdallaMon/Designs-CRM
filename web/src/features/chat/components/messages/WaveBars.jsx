"use client";

import React from "react";
import { Box } from "@mui/material";

export function WaveBars({ active }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-end",
        gap: 0.5,
        height: 18,
        px: 0.5,
        "@keyframes wave": {
          "0%": { transform: "scaleY(0.35)", opacity: 0.5 },
          "50%": { transform: "scaleY(1)", opacity: 1 },
          "100%": { transform: "scaleY(0.35)", opacity: 0.5 },
        },
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Box
          key={i}
          sx={{
            width: 3,
            borderRadius: 2,
            bgcolor: "error.main",
            height: 18,
            transformOrigin: "bottom",
            animation: active ? "wave 0.9s ease-in-out infinite" : "none",
            animationDelay: `${i * 0.12}s`,
            opacity: active ? 1 : 0.35,
          }}
        />
      ))}
    </Box>
  );
}

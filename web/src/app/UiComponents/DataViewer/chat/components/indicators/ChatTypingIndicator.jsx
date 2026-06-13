"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

export function ChatTypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) return null;

  return (
    <Box
      sx={{
        mt: 2,
        display: "flex",
        alignItems: "center",
        gap: 1,
        animation: "fadeIn 0.3s ease-in",
        "@keyframes fadeIn": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontStyle: "italic", color: "textSecondary" }}
      >
        {typingUsers.length === 1
          ? `${typingUsers[0]?.message || "Someone is Typing"}`
          : `${typingUsers.length} people are typing`}
      </Typography>

      {/* Bouncing dots animation */}
      <Box sx={{ display: "flex", gap: 0.5 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "primary.main",
              animation: "bounce 1.4s infinite",
              animationDelay: `${i * 0.2}s`,
              "@keyframes bounce": {
                "0%, 80%, 100%": { opacity: 0.5 },
                "40%": { opacity: 1 },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

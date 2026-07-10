// SpecialClauses.jsx
"use client";

import React from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { SectionCard } from "@/features/contracts/client/sections/primitives.jsx";

export default function SpecialClauses({ items = [], lng }) {
  const theme = useTheme();
  if (!items.length) return null;

  // Always show all special clauses (بنود خاصة) and slightly lighter background
  return (
    <SectionCard title={lng === "ar" ? "بنود خاصة" : "Special Terms"} dense>
      <Stack spacing={1}>
        {items.map((t, i) => (
          <Box
            key={i}
            sx={{
              borderLeft: `3px solid ${theme.palette.primary.main}`,
              pl: 1.5,
              py: 1,
              backgroundColor: alpha(theme.palette.primary.main, 0.03),
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
              • {t}
            </Typography>
          </Box>
        ))}
      </Stack>
    </SectionCard>
  );
}

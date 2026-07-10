// ReadableStageClauses.jsx
"use client";

import React from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { SectionCard, ClauseCard } from "./primitives";

// Readable stage clauses (now always fully expanded — no collapse)
export default function ReadableStageClauses({ lng, stageClauses }) {
  const theme = useTheme();
  if (!stageClauses || !stageClauses.length) return null;
  return (
    <SectionCard title={lng === "ar" ? "بنود المراحل" : "Stage Clauses"}>
      <Stack spacing={2.5}>
        {stageClauses.map((clause, i) => (
          <Box key={i}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              {lng === "ar" ? clause.headingAr : clause.headingEn}
            </Typography>
            <ClauseCard
              title={lng === "ar" ? clause.titleAr : clause.titleEn}
              text={lng === "ar" ? clause.descriptionAr : clause.descriptionEn}
              theme={theme}
              isRtl={lng === "ar"}
            />
          </Box>
        ))}
      </Stack>
    </SectionCard>
  );
}

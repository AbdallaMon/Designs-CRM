// RenderStageBullets.jsx
import React from "react";
import { Stack, Typography } from "@mui/material";

// -----------------------------
// Stages: responsive -- mobile: show all stages expanded (no Accordion).
// -----------------------------
export default function RenderStageBullets({ details }) {
  // `details` is a stage's text blob (textAr/textEn), which can legitimately be null/missing
  // for a stage that has no clause — render nothing rather than crashing on `.split`.
  const seperateByNewLineIntoBullets = (details || "")
    .split("\n")
    .filter((line) => line.trim() !== "");
  return (
    <Stack spacing={0.5}>
      {seperateByNewLineIntoBullets.map((line, i) => (
        <Typography key={i} variant="body2">
          • {line}
        </Typography>
      ))}
    </Stack>
  );
}

// RenderStageBullets.jsx
import React from "react";
import { Stack, Typography } from "@mui/material";

// -----------------------------
// Stages: responsive -- mobile: show all stages expanded (no Accordion).
// -----------------------------
export default function RenderStageBullets({ details }) {
  const seperateByNewLineIntoBullets = details
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

"use client";

import { Stack, Typography } from "@mui/material";

export default function RowText({ label, value }) {
  return (
    <Stack spacing={0.5} flex={1}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ wordBreak: "break-word", fontWeight: 500 }}
      >
        {value || "—"}
      </Typography>
    </Stack>
  );
}

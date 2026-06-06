"use client";
import { alpha, Box, CircularProgress, Typography } from "@mui/material";
import { ZINDEXS } from "../../constants";

export default function LoadingOverlay({
  message,
  isLoading,
  type = "overlay",
}) {
  if (!isLoading) return null;
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: (theme) => alpha(theme.palette.background.default, 0.8),
        zIndex:
          type === "overlay"
            ? ZINDEXS.LOADINGOVERLAY
            : ZINDEXS.TOASTLOADINGOVERLAY,
        gap: 1.5,
        height: "100vh",
        left: 0,
        top: 0,
      }}
    >
      <CircularProgress color="primary" size={36} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}

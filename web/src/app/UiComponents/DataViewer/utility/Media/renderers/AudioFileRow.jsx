"use client";
import { Box, IconButton, Typography } from "@mui/material";
import { FaDownload } from "react-icons/fa";
import { getFileConfig } from "@/app/UiComponents/DataViewer/utility/Media/fileTypes.js";

export function AudioFileRow({ att, handleMediaReady }) {
  const mime = att?.fileMimeType || "";
  const fileUrl = att?.fileUrl;
  const { icon: Icon, color, label } = getFileConfig(mime);

  if (!fileUrl) return null;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 360,
        borderRadius: 1.5,
        minWidth: 240,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        p: 1,
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Icon color={color} />
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          {label || "Audio"}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <IconButton size="small" onClick={() => window.open(fileUrl, "_blank")}>
          <FaDownload />
        </IconButton>
      </Box>

      <Typography
        variant="caption"
        sx={{ opacity: 0.8, wordBreak: "break-word" }}
      >
        {att?.fileName}
      </Typography>

      <audio
        src={fileUrl}
        controls
        style={{ width: "100%" }}
        onCanPlay={() => {
          handleMediaReady?.();
        }}
        onError={() => {
          handleMediaReady?.();
        }}
      />
    </Box>
  );
}

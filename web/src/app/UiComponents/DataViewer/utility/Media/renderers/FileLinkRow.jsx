"use client";
import { Box, Typography } from "@mui/material";
import { FaDownload } from "react-icons/fa";
import { useEffect } from "react";
import { getFileConfig, isPdf } from "../fileTypes";

export function FileLinkRow({ att, iframe, handleMediaReady }) {
  const mime = att?.fileMimeType || "";
  const fileUrl = att?.fileUrl;
  const { icon: Icon, color, label } = getFileConfig(mime);

  if (!fileUrl) return null;
  useEffect(() => {
    if (!isPdf(mime)) {
      handleMediaReady?.();
    }
  }, [att]);
  return (
    <>
      {iframe && isPdf(mime) ? (
        <iframe
          src={fileUrl}
          onLoad={handleMediaReady}
          style={{
            width: "100%",
            height: "90vh",
            border: "none",
            zIndex: 2,
            background: "#fff",
          }}
        />
      ) : (
        <Box
          component="a"
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          sx={{
            width: "100%",
            maxWidth: 360,
            borderRadius: 1.5,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            p: 1,
            textDecoration: "none",
            color: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 1,
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1.2,
              bgcolor: "grey.100",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon color={color} />
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 800, lineHeight: 1.2 }}
            >
              {label || "File"}
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.8, display: "block" }}
              noWrap
              title={att?.fileName}
            >
              {att?.fileName}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.6,
              px: 1,
              py: 0.5,
              borderRadius: "999px",
              bgcolor: "rgba(0,0,0,0.04)",
            }}
          >
            <FaDownload size={12} />
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              Download
            </Typography>
          </Box>
        </Box>
      )}
    </>
  );
}

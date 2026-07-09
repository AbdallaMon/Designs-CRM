"use client";
import { Box, IconButton, Typography } from "@mui/material";
import { FaDownload, FaPlay } from "react-icons/fa";
import { getFileConfig, isImage, isVideo } from "../fileTypes";

export function GridFileItem({ file, onPreview }) {
  const config = getFileConfig(file.fileMimeType);
  const Icon = config.icon;

  const Image = isImage(file.fileMimeType);
  const Video = isVideo(file.fileMimeType);

  const handleClick = () => {
    if (Image || Video) {
      onPreview(file);
    } else {
      window.open(file.fileUrl, "_blank");
    }
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
        cursor: "pointer",
        bgcolor: "grey.100",
        aspectRatio: "1 / 1",
        "&:hover .overlay": {
          opacity: 1,
        },
      }}
    >
      {/* IMAGE */}
      {Image && (
        <img
          src={file.fileUrl}
          alt={file.fileName}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {/* VIDEO */}
      {Video && (
        <>
          <video
            src={file.fileUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            muted
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(0,0,0,0.4)",
            }}
          >
            <FaPlay size={36} color="white" />
          </Box>
        </>
      )}

      {/* OTHER FILE TYPES */}
      {!Image && !Video && (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: config.color,
            color: "white",
            p: 1,
            textAlign: "center",
          }}
        >
          <Icon size={36} />
          <Typography variant="caption" mt={1} noWrap>
            {file.fileName}
          </Typography>
        </Box>
      )}

      {/* HOVER OVERLAY */}
      <Box
        className="overlay"
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(0,0,0,0.55)",
          color: "white",
          opacity: 0,
          transition: "0.2s",
          display: "flex",
          alignItems: "flex-end",
          p: 1,
        }}
      >
        <Typography variant="caption" noWrap>
          {file.fileName}
        </Typography>
      </Box>

      {/* DOWNLOAD */}
      <IconButton
        size="small"
        component="a"
        href={file.fileUrl}
        download={file.fileName}
        target="_blank"
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "absolute",
          top: 6,
          right: 6,
          bgcolor: "rgba(0,0,0,0.6)",
          color: "white",
          "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
        }}
      >
        <FaDownload size={12} />
      </IconButton>
    </Box>
  );
}

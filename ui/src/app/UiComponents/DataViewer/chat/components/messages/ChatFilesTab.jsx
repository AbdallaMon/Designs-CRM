"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from "@mui/material";
import {
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFileWord,
  FaFileExcel,
  FaFileArchive,
  FaFile,
  FaDownload,
  FaPlay,
  FaTimes,
  FaSearch,
} from "react-icons/fa";
import dayjs from "dayjs";
import {
  FILE_TYPE_CATEGORIES,
  FILE_TYPE_CONFIG,
} from "@/app/helpers/constants";
import { useChatFiles } from "../../hooks";

/* ================= Helpers ================= */

function getFileConfig(mimeType) {
  return (
    FILE_TYPE_CONFIG[mimeType] || {
      icon: FaFile,
      color: "#757575",
      label: "File",
    }
  );
}

function formatMonthYear(monthStr) {
  const [year, month] = monthStr.split("-");
  return dayjs(`${year}-${month}-01`).format("MMMM YYYY");
}

/* ================= Grid Item ================= */

function GridFileItem({ file, onPreview }) {
  const config = getFileConfig(file.fileMimeType);
  const Icon = config.icon;

  const isImage = file.fileMimeType?.startsWith("image/");
  const isVideo = file.fileMimeType?.startsWith("video/");

  const handleClick = () => {
    if (isImage || isVideo) {
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
      {isImage && (
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
      {isVideo && (
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
      {!isImage && !isVideo && (
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

/* ================= Main Component ================= */

export function ChatFilesTab({ roomId }) {
  const [selectedType, setSelectedType] = useState([]);
  const debounceRef = useRef(null);

  const {
    filesByMonth,
    sortedMonths,
    loading,
    loadingMore,
    hasMore,
    loadMoreFiles,
    total,
  } = useChatFiles(roomId, {
    fileType: selectedType,
  });

  const [previewFile, setPreviewFile] = useState(null);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (
      hasMore &&
      !loadingMore &&
      scrollTop + clientHeight >= scrollHeight - 100
    ) {
      loadMoreFiles();
    }
  };

  return (
    <>
      {/* SEARCH & FILTER */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <ToggleButtonGroup
          value={selectedType}
          onChange={(e, val) => setSelectedType(val)}
          size="small"
          exclusive
          sx={{ flexWrap: "wrap", gap: 1 }}
        >
          {FILE_TYPE_CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <ToggleButton key={c.value} value={c.value}>
                <Icon size={14} style={{ marginRight: 4 }} />
                {c.label}
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>
      </Box>

      {/* GRID */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }} onScroll={handleScroll}>
        {sortedMonths?.map((month) => (
          <Box key={month} mb={3}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              {formatMonthYear(month)}
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 1.5,
              }}
            >
              {filesByMonth &&
                filesByMonth[month].map((file) => (
                  <GridFileItem
                    key={file.id}
                    file={file}
                    onPreview={setPreviewFile}
                  />
                ))}
            </Box>
          </Box>
        ))}

        {loadingMore && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>

      {/* FULLSCREEN PREVIEW */}
      <Dialog
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiPaper-root": {
            margin: "10px !important",
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography noWrap>{previewFile?.fileName}</Typography>
          <IconButton onClick={() => setPreviewFile(null)}>
            <FaTimes />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 0,
            bgcolor: "black",
          }}
        >
          {previewFile?.fileMimeType?.startsWith("image/") && (
            <img
              src={previewFile.fileUrl}
              style={{
                width: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
              }}
            />
          )}

          {previewFile?.fileMimeType?.startsWith("video/") && (
            <video
              src={previewFile.fileUrl}
              controls
              autoPlay
              style={{
                width: "100%",
                maxHeight: "80vh",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

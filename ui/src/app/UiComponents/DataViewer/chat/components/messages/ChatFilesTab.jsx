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
import { LoadMoreButton } from "../indicators/LoadMoreButton";
import { RenderListOfFiles } from "../../../utility/Media/MediaRender";

/* ================= Helpers ================= */

/* ================= Main Component ================= */

export function ChatFilesTab({ roomId }) {
  const [selectedType, setSelectedType] = useState([]);

  const {
    loading,
    loadingMore,
    hasMore,
    loadMore,
    total,
    totalPages,
    pageRef,
    initialLoading,
    scrollContainerRef,
    filesEndRef,
    files,
    uniqueMonths,
  } = useChatFiles(roomId, {
    fileType: selectedType,
  });
  const canLoadMore = hasMore && !loadingMore && !initialLoading && !loading;
  const [previewFile, setPreviewFile] = useState(null);
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
      <Box
        sx={{ flex: 1, overflow: "auto", p: 2, height: "75vh" }}
        ref={scrollContainerRef}
      >
        <RenderListOfFiles
          attachments={files}
          groupByMonth={true}
          currentRenderedMonths={uniqueMonths}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onNearToEnd={loadMore}
        />
        {/* {sortedMonths?.map((month) => (
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
        ))} */}
        <div ref={filesEndRef} />

        <LoadMoreButton
          onClick={loadMore}
          disabled={!canLoadMore}
          loadingMore={loadingMore}
        />

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

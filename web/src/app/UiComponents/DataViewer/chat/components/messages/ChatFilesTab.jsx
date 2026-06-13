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

export function ChatFilesTab({ roomId, currentTab, setCurrentTab, clientId }) {
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
    clientId,
  });
  const canLoadMore = hasMore && !loadingMore && !initialLoading && !loading;
  return (
    <>
      <Dialog
        open={currentTab === 1}
        onClose={() => setCurrentTab(0)}
        fullWidth
        maxWidth="md"
        sx={{
          "& .MuiPaper-root": {
            margin: "10px !important",
            width: "calc(100% - 20px)",
          },
          zIndex: 1302,
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography>Chat Files</Typography>
            <IconButton onClick={() => setCurrentTab(0)}>
              <FaTimes />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            padding: "12px !important",
          }}
        >
          {" "}
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
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { FaTimes } from "react-icons/fa";
import { useChatFiles } from "../../hooks";
import { LoadMoreButton } from "../indicators/LoadMoreButton.jsx";
import { ChatAttachments } from "./ChatAttachments.jsx";

const FILE_TYPE_CATEGORIES = [
  { label: "صور", value: "image" },
  { label: "فيديو", value: "video" },
  { label: "صوت", value: "audio" },
  { label: "مستندات", value: "document" },
];

export function ChatFilesTab({ roomId, currentTab, setCurrentTab }) {
  const [selectedType, setSelectedType] = useState([]);
  const {
    loading,
    loadingMore,
    hasMore,
    loadMore,
    initialLoading,
    scrollContainerRef,
    filesEndRef,
    files,
  } = useChatFiles(roomId, { fileType: selectedType });

  const canLoadMore = hasMore && !loadingMore && !initialLoading && !loading;

  return (
    <Dialog
      open={currentTab === 1}
      onClose={() => setCurrentTab(0)}
      fullWidth
      maxWidth="md"
      sx={{ "& .MuiPaper-root": { margin: "10px !important", width: "calc(100% - 20px)" }, zIndex: 1302 }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography>ملفات المحادثة</Typography>
          <IconButton onClick={() => setCurrentTab(0)}>
            <FaTimes />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ padding: "12px !important" }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <ToggleButtonGroup
            value={selectedType}
            onChange={(_e, val) => setSelectedType(val)}
            size="small"
            exclusive
            sx={{ flexWrap: "wrap", gap: 1 }}
          >
            {FILE_TYPE_CATEGORIES.map((c) => (
              <ToggleButton key={c.value} value={c.value}>
                {c.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ flex: 1, overflow: "auto", p: 2, height: "75vh" }} ref={scrollContainerRef}>
          {initialLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : files.length === 0 ? (
            <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
              لا توجد ملفات
            </Typography>
          ) : (
            <ChatAttachments attachments={files} />
          )}
          <div ref={filesEndRef} />
          <LoadMoreButton onClick={loadMore} disabled={!canLoadMore} loadingMore={loadingMore} />
          {loadingMore && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

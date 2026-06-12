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
import { useT } from "@/app/v2/lib/i18n";

const buildFileTypeCategories = (t) => [
  { label: t("chat.files.category.image", "صور"), value: "image" },
  { label: t("chat.files.category.video", "فيديو"), value: "video" },
  { label: t("chat.files.category.audio", "صوت"), value: "audio" },
  { label: t("chat.files.category.document", "مستندات"), value: "document" },
];

export function ChatFilesTab({ roomId, currentTab, setCurrentTab, clientCtx = null }) {
  const { t } = useT();
  const fileTypeCategories = buildFileTypeCategories(t);
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
  } = useChatFiles(roomId, { fileType: selectedType, clientCtx });

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
          <Typography>{t("chat.files.title", "ملفات المحادثة")}</Typography>
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
            {fileTypeCategories.map((c) => (
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
              {t("chat.files.empty", "لا توجد ملفات")}
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

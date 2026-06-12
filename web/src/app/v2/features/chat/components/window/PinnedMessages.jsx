"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Box,
  IconButton,
  Drawer,
  Typography,
  List,
  ListItemButton,
  Divider,
  CircularProgress,
  Badge,
  Paper,
  Avatar,
} from "@mui/material";
import { MdPushPin, MdClose, MdKeyboardArrowUp, MdKeyboardArrowDown } from "react-icons/md";
import { FaFileAlt, FaFileImage, FaFilePdf, FaFileVideo, FaFileAudio } from "react-icons/fa";
import { useT } from "@/app/v2/lib/i18n";

const MAX_PINNED = 20;

export function PinnedMessages({
  handleJumpToMessage,
  loadingJumpToMessage,
  chatContainerRef,
  pinnedMessages,
  loadingPinnedMessages,
}) {
  const { t } = useT();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const lastScrollTop = useRef(0);

  const displayedMessages = useMemo(() => {
    const sorted = [...(pinnedMessages || [])].sort((a, b) => (b?.id || 0) - (a?.id || 0));
    return sorted.slice(0, MAX_PINNED);
  }, [pinnedMessages]);

  const currentMessage = displayedMessages[currentIndex];

  const clampIndex = useCallback(
    (idx) => {
      if (!displayedMessages.length) return 0;
      return Math.max(0, Math.min(idx, displayedMessages.length - 1));
    },
    [displayedMessages.length],
  );

  useEffect(() => setCurrentIndex((prev) => clampIndex(prev)), [clampIndex]);

  const renderFileIcon = (mimeType) => {
    if (!mimeType) return <FaFileAlt size={16} />;
    if (mimeType.startsWith("image/")) return <FaFileImage size={16} color="#4CAF50" />;
    if (mimeType.startsWith("video/")) return <FaFileVideo size={16} color="#2196F3" />;
    if (mimeType.startsWith("audio/")) return <FaFileAudio size={16} color="#FF9800" />;
    if (mimeType === "application/pdf") return <FaFilePdf size={16} color="#F44336" />;
    return <FaFileAlt size={16} color="#757575" />;
  };

  const renderMessagePreview = (msg) => {
    const hasFile = msg?.fileUrl && msg?.type !== "TEXT";
    const hasContent = msg?.content && msg.content.trim() !== "";
    if (hasFile && hasContent) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {renderFileIcon(msg.fileMimeType)}
            <Typography variant="caption" sx={{ fontStyle: "italic", color: "text.secondary" }}>
              {msg.fileName || t("chat.pinned.file", "ملف")}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.primary" }}>{msg.content}</Typography>
        </Box>
      );
    }
    if (hasFile) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {renderFileIcon(msg.fileMimeType)}
          <Typography variant="body2" sx={{ fontStyle: "italic" }}>{msg.fileName || t("chat.pinned.file", "ملف")}</Typography>
        </Box>
      );
    }
    if (hasContent) return <Typography variant="body2" sx={{ color: "text.primary" }}>{msg.content}</Typography>;
    return <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary" }}>{t("chat.pinned.message", "رسالة")}</Typography>;
  };

  const navigateToMessage = async (index, options = {}) => {
    const { autoAdvance = false, closeDrawer = false } = options;
    const targetIndex = clampIndex(index);
    const target = displayedMessages[targetIndex];
    if (!target) return;
    setIsNavigating(true);
    setCurrentIndex(targetIndex);
    try {
      await handleJumpToMessage(target.id);
    } finally {
      const nextIndex = autoAdvance ? clampIndex(targetIndex + 1) : targetIndex;
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setIsNavigating(false);
        if (closeDrawer) setDrawerOpen(false);
      }, 350);
    }
  };

  const handleNext = () => {
    if (currentIndex < displayedMessages.length - 1) navigateToMessage(currentIndex + 1);
  };
  const handlePrevious = () => {
    if (currentIndex > 0) navigateToMessage(currentIndex - 1);
  };
  const handleMessageClick = (messageId) => {
    const idx = displayedMessages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;
    navigateToMessage(idx, { autoAdvance: true, closeDrawer: true });
  };
  const toggleDrawer = () => setDrawerOpen((v) => !v);

  useEffect(() => {
    if (!chatContainerRef?.current || displayedMessages.length === 0) return;
    const container = chatContainerRef.current;
    const ACTIVATE_OFFSET = 60;
    const isInActivationLine = (rect, containerRect) => {
      const lineY = containerRect.top + ACTIVATE_OFFSET;
      return rect.top <= lineY && rect.bottom >= lineY;
    };
    const handleScroll = () => {
      if (isNavigating) return;
      const scrollTop = container.scrollTop;
      const scrollingUp = scrollTop < lastScrollTop.current;
      const scrollingDown = scrollTop > lastScrollTop.current;
      lastScrollTop.current = scrollTop;
      const containerRect = container.getBoundingClientRect();
      if (scrollingUp) {
        const el = document.getElementById(`message-${currentMessage?.id}`);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top > containerRect.bottom && currentIndex < displayedMessages.length - 1) {
          setCurrentIndex((prev) => Math.min(prev + 1, displayedMessages.length - 1));
        }
        return;
      }
      if (scrollingDown) {
        let best = null;
        for (let i = 0; i < displayedMessages.length; i++) {
          const el = document.getElementById(`message-${displayedMessages[i].id}`);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (!isInActivationLine(rect, containerRect)) continue;
          const lineY = containerRect.top + ACTIVATE_OFFSET;
          const dist = Math.abs(rect.top - lineY);
          if (!best || dist < best.dist) best = { index: i, dist };
        }
        if (best && best.index !== currentIndex) setCurrentIndex(best.index);
      }
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [chatContainerRef, displayedMessages, currentMessage?.id, currentIndex, isNavigating]);

  if (displayedMessages.length === 0) return null;

  return (
    <>
      <Paper
        elevation={2}
        sx={{
          zIndex: 1000,
          bgcolor: (t) => `${t.palette.primary.main}15`,
          borderBottom: (t) => `2px solid ${t.palette.primary.main}`,
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 1,
          gap: 1,
        }}
      >
        <MdPushPin size={20} />
        <Box
          onClick={() => navigateToMessage(currentIndex, { autoAdvance: true })}
          sx={{ flex: 1, cursor: "pointer", minWidth: 0, "&:hover": { opacity: 0.85 } }}
        >
          <Typography variant="caption" sx={{ color: "primary.main", fontWeight: "bold", display: "block" }}>
            {currentMessage?.sender?.name || t("chat.pinned.unknownUser", "مستخدم غير معروف")}
          </Typography>
          <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {renderMessagePreview(currentMessage)}
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: "primary.main", fontWeight: "bold", minWidth: 40, textAlign: "center" }}>
            {currentIndex + 1}/{displayedMessages.length}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <IconButton size="small" onClick={handleNext} disabled={currentIndex === displayedMessages.length - 1 || isNavigating} sx={{ p: 0.25, color: "primary.main" }}>
              <MdKeyboardArrowUp size={20} />
            </IconButton>
            <IconButton size="small" onClick={handlePrevious} disabled={currentIndex === 0 || isNavigating} sx={{ p: 0.25, color: "primary.main" }}>
              <MdKeyboardArrowDown size={20} />
            </IconButton>
          </Box>
          <IconButton size="small" onClick={toggleDrawer} sx={{ color: "primary.main", ml: 1 }}>
            <Badge badgeContent={displayedMessages.length} color="error" max={20}>
              <MdPushPin size={20} />
            </Badge>
          </IconButton>
        </Box>
        {(loadingJumpToMessage || isNavigating) && <CircularProgress size={16} color="primary" />}
      </Paper>

      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer} slotProps={{ paper: { sx: { width: { xs: "90%", sm: 400 }, maxWidth: "100%" } } }}>
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, bgcolor: "primary.main", color: "primary.contrastText", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MdPushPin size={24} />
              <Typography variant="h6" fontWeight="bold">{t("chat.pinned.title", "الرسائل المثبتة")}</Typography>
            </Box>
            <IconButton onClick={toggleDrawer} sx={{ color: "inherit" }}>
              <MdClose size={24} />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {loadingPinnedMessages ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {displayedMessages.map((msg, index) => (
                  <Box key={msg.id}>
                    <ListItemButton
                      onClick={() => handleMessageClick(msg.id)}
                      sx={{
                        py: 2,
                        px: 2,
                        bgcolor: index === currentIndex ? (t) => `${t.palette.primary.main}10` : "transparent",
                        borderInlineStart: index === currentIndex ? (t) => `4px solid ${t.palette.primary.main}` : "4px solid transparent",
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 2, width: "100%", alignItems: "flex-start" }}>
                        <Avatar src={msg.sender?.profilePicture} sx={{ width: 40, height: 40 }}>
                          {msg.sender?.name?.[0]?.toUpperCase() || "U"}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                            {msg.sender?.name || t("chat.pinned.unknownUser", "مستخدم غير معروف")}
                          </Typography>
                          <Box sx={{ mt: 0.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                            {renderMessagePreview(msg)}
                          </Box>
                        </Box>
                      </Box>
                    </ListItemButton>
                    {index < displayedMessages.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

export default PinnedMessages;

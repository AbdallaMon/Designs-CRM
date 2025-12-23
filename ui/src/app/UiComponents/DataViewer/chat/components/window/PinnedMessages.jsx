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
import {
  MdPushPin,
  MdClose,
  MdKeyboardArrowUp,
  MdKeyboardArrowDown,
} from "react-icons/md";
import {
  FaFileAlt,
  FaFileImage,
  FaFilePdf,
  FaFileVideo,
  FaFileAudio,
} from "react-icons/fa";
import { getData } from "@/app/helpers/functions/getData";
import colors from "@/app/helpers/colors";
import { useSocket } from "../../hooks";

const MAX_PINNED = 20;

export default function PinnedMessages({
  roomId,
  handleJumpToMessage,
  loadingJumpToMessage,
  chatContainerRef,
}) {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const lastScrollTop = useRef(0);

  const displayedMessages = useMemo(() => {
    const sorted = [...(pinnedMessages || [])].sort(
      (a, b) => (b?.id || 0) - (a?.id || 0)
    );
    return sorted.slice(0, MAX_PINNED);
  }, [pinnedMessages]);

  const currentMessage = displayedMessages[currentIndex];

  const clampIndex = useCallback(
    (idx) => {
      if (!displayedMessages.length) return 0;
      return Math.max(0, Math.min(idx, displayedMessages.length - 1));
    },
    [displayedMessages.length]
  );

  // Keep currentIndex valid when list updates
  useEffect(() => {
    setCurrentIndex((prev) => clampIndex(prev));
  }, [clampIndex]);

  const fetchPinnedMessages = async () => {
    if (!roomId) return;

    const response = await getData({
      url: `shared/chat/${roomId}/pinned-messages`,
      setLoading,
    });

    if (response?.status === 200) {
      setPinnedMessages(response.data || []);
    }
  };

  useEffect(() => {
    if (roomId) fetchPinnedMessages();
  }, [roomId]);

  useSocket({
    onMessagePinned: (data) => {
      if (data.roomId === roomId) fetchPinnedMessages();
    },
    onMessageUnpinned: (data) => {
      if (data.roomId === roomId) fetchPinnedMessages();
    },
  });

  // ===== File icon =====
  const renderFileIcon = (mimeType) => {
    if (!mimeType) return <FaFileAlt size={16} />;

    if (mimeType.startsWith("image/"))
      return <FaFileImage size={16} color="#4CAF50" />;
    if (mimeType.startsWith("video/"))
      return <FaFileVideo size={16} color="#2196F3" />;
    if (mimeType.startsWith("audio/"))
      return <FaFileAudio size={16} color="#FF9800" />;
    if (mimeType === "application/pdf")
      return <FaFilePdf size={16} color="#F44336" />;

    return <FaFileAlt size={16} color="#757575" />;
  };

  const renderMessagePreview = (message) => {
    const hasFile = message?.fileUrl && message?.type !== "TEXT";
    const hasContent = message?.content && message.content.trim() !== "";

    if (hasFile && hasContent) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {renderFileIcon(message.fileMimeType)}
            <Typography
              variant="caption"
              sx={{ fontStyle: "italic", color: "text.secondary" }}
            >
              {message.fileName || "File"}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.primary" }}>
            {message.content}
          </Typography>
        </Box>
      );
    }

    if (hasFile) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {renderFileIcon(message.fileMimeType)}
          <Typography variant="body2" sx={{ fontStyle: "italic" }}>
            {message.fileName || "File"}
          </Typography>
        </Box>
      );
    }

    if (hasContent) {
      return (
        <Typography variant="body2" sx={{ color: "text.primary" }}>
          {message.content}
        </Typography>
      );
    }

    return (
      <Typography
        variant="body2"
        sx={{ fontStyle: "italic", color: "text.secondary" }}
      >
        Message
      </Typography>
    );
  };

  // ===== Navigation core =====
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
      // WhatsApp-like: after jump, show NEXT pinned in bar (if exists)
      const nextIndex = autoAdvance ? clampIndex(targetIndex + 1) : targetIndex;

      // give the chat a moment to settle so scroll listener doesn’t fight
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setIsNavigating(false);
        if (closeDrawer) setDrawerOpen(false);
      }, 350);
    }
  };

  // Reversed logic:
  // Arrow UP = NEXT (index + 1)
  // Arrow DOWN = PREV (index - 1)
  const handleNext = () => {
    if (currentIndex < displayedMessages.length - 1) {
      navigateToMessage(currentIndex + 1, { autoAdvance: false });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      navigateToMessage(currentIndex - 1, { autoAdvance: false });
    }
  };

  const handleMessageClick = (messageId) => {
    const idx = displayedMessages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;

    // click pinned message -> jump then render NEXT on bar
    navigateToMessage(idx, { autoAdvance: true, closeDrawer: true });
  };

  const toggleDrawer = () => setDrawerOpen((v) => !v);

  // ===== Scroll detection (final behavior) =====
  useEffect(() => {
    if (!chatContainerRef?.current || displayedMessages.length === 0) return;

    const container = chatContainerRef.current;

    // activation line from top of container
    const ACTIVATE_OFFSET = 60;

    const isInActivationLine = (rect, containerRect) => {
      const lineY = containerRect.top + ACTIVATE_OFFSET;
      return rect.top <= lineY && rect.bottom >= lineY;
    };

    const handleScroll = () => {
      if (isNavigating) return;

      const scrollTop = container.scrollTop;
      const scrollingUp = scrollTop < lastScrollTop.current; // going to TOP (older)
      const scrollingDown = scrollTop > lastScrollTop.current; // going to BOTTOM (newer)
      lastScrollTop.current = scrollTop;

      const containerRect = container.getBoundingClientRect();

      // 1) scrolling UP: when you pass current pinned -> go NEXT (index + 1)
      if (scrollingUp) {
        const el = document.getElementById(`message-${currentMessage?.id}`);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const messageIsBelowViewport = rect.top > containerRect.bottom;

        if (
          messageIsBelowViewport &&
          currentIndex < displayedMessages.length - 1
        ) {
          setCurrentIndex((prev) =>
            Math.min(prev + 1, displayedMessages.length - 1)
          );
        }
        return;
      }

      // 2) scrolling DOWN: when you REACH a pinned message -> make it active
      if (scrollingDown) {
        let best = null;

        for (let i = 0; i < displayedMessages.length; i++) {
          const msg = displayedMessages[i];
          const el = document.getElementById(`message-${msg.id}`);
          if (!el) continue;

          const rect = el.getBoundingClientRect();
          if (!isInActivationLine(rect, containerRect)) continue;

          const lineY = containerRect.top + ACTIVATE_OFFSET;
          const dist = Math.abs(rect.top - lineY);

          if (!best || dist < best.dist) best = { index: i, dist };
        }

        if (best && best.index !== currentIndex) {
          setCurrentIndex(best.index);
        }
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [
    chatContainerRef,
    displayedMessages,
    currentMessage?.id,
    currentIndex,
    isNavigating,
  ]);

  // Don't show if no pinned messages
  if (displayedMessages.length === 0) return null;

  return (
    <>
      {/* WhatsApp-style Pinned Message Bar */}
      <Paper
        elevation={2}
        sx={{
          top: 60,
          left: 0,
          right: 0,
          zIndex: 1000,
          bgcolor: colors.primary + "15",
          borderBottom: `2px solid ${colors.primary}`,
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 1,
          gap: 1,
        }}
      >
        <MdPushPin size={20} color={colors.primary} />

        {/* Click bar -> jump to current pinned then show NEXT in bar */}
        <Box
          onClick={() => navigateToMessage(currentIndex, { autoAdvance: true })}
          sx={{
            flex: 1,
            cursor: "pointer",
            minWidth: 0,
            "&:hover": { opacity: 0.85 },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: colors.primary,
              fontWeight: "bold",
              display: "block",
            }}
          >
            {currentMessage?.sender?.name || "Unknown User"}
          </Typography>

          <Box
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {renderMessagePreview(currentMessage)}
          </Box>
        </Box>

        {/* Right controls */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: colors.primary,
              fontWeight: "bold",
              minWidth: 40,
              textAlign: "center",
            }}
          >
            {currentIndex + 1}/{displayedMessages.length}
          </Typography>

          {/* REVERSED buttons */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* UP = NEXT */}
            <IconButton
              size="small"
              onClick={handleNext}
              disabled={
                currentIndex === displayedMessages.length - 1 || isNavigating
              }
              sx={{
                p: 0.25,
                color: colors.primary,
                "&:disabled": { color: "text.disabled" },
              }}
            >
              <MdKeyboardArrowUp size={20} />
            </IconButton>

            {/* DOWN = PREV */}
            <IconButton
              size="small"
              onClick={handlePrevious}
              disabled={currentIndex === 0 || isNavigating}
              sx={{
                p: 0.25,
                color: colors.primary,
                "&:disabled": { color: "text.disabled" },
              }}
            >
              <MdKeyboardArrowDown size={20} />
            </IconButton>
          </Box>

          <IconButton
            size="small"
            onClick={toggleDrawer}
            sx={{ color: colors.primary, ml: 1 }}
          >
            <Badge
              badgeContent={displayedMessages.length}
              color="error"
              max={20}
            >
              <MdPushPin size={20} />
            </Badge>
          </IconButton>
        </Box>

        {(loadingJumpToMessage || isNavigating) && (
          <CircularProgress size={16} sx={{ color: colors.primary }} />
        )}
      </Paper>

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer}
        PaperProps={{ sx: { width: { xs: "90%", sm: 400 }, maxWidth: "100%" } }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: colors.primary,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MdPushPin size={24} />
              <Typography variant="h6" fontWeight="bold">
                Pinned Messages
              </Typography>
            </Box>

            <IconButton onClick={toggleDrawer} sx={{ color: "white" }}>
              <MdClose size={24} />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <CircularProgress />
              </Box>
            ) : displayedMessages.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  color: "text.secondary",
                }}
              >
                <Typography>No pinned messages</Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {displayedMessages.map((message, index) => (
                  <Box key={message.id}>
                    <ListItemButton
                      onClick={() => handleMessageClick(message.id)}
                      sx={{
                        py: 2,
                        px: 2,
                        bgcolor:
                          index === currentIndex
                            ? colors.primary + "10"
                            : "transparent",
                        borderLeft:
                          index === currentIndex
                            ? `4px solid ${colors.primary}`
                            : "4px solid transparent",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          width: "100%",
                          alignItems: "flex-start",
                        }}
                      >
                        <Avatar
                          src={message.sender?.profilePicture}
                          sx={{
                            bgcolor: colors.secondary,
                            width: 40,
                            height: 40,
                          }}
                        >
                          {message.sender?.name?.[0]?.toUpperCase() || "U"}
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle2"
                            fontWeight="bold"
                            color="text.primary"
                          >
                            {message.sender?.name || "Unknown User"}
                          </Typography>

                          <Box
                            sx={{
                              mt: 0.5,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {renderMessagePreview(message)}
                          </Box>

                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ mt: 0.5, display: "block" }}
                          >
                            {new Date(message.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItemButton>

                    {index < displayedMessages.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Box>

          {/* Footer */}
          <Paper
            elevation={3}
            sx={{
              p: 1.5,
              bgcolor: "background.default",
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ display: "block" }}
            >
              {displayedMessages.length} pinned message
              {displayedMessages.length !== 1 ? "s" : ""}
              {pinnedMessages.length > MAX_PINNED &&
                ` (showing first ${MAX_PINNED})`}
            </Typography>
          </Paper>
        </Box>
      </Drawer>
    </>
  );
}

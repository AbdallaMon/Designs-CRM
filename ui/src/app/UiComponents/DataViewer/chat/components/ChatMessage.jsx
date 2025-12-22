"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  FaEllipsisV,
  FaReply,
  FaEdit,
  FaTrash,
  FaDownload,
  FaPlay,
  FaFile,
} from "react-icons/fa";
import { MdPushPin } from "react-icons/md";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FILE_TYPE_CONFIG } from "@/app/helpers/constants";

dayjs.extend(relativeTime);

/* ===================== Helpers ===================== */

function getFileConfig(mimeType) {
  return (
    FILE_TYPE_CONFIG[mimeType] || {
      icon: FaFile,
      color: "#757575",
      label: "File",
    }
  );
}

function isImage(mime) {
  return mime?.startsWith("image/");
}
function isVideo(mime) {
  return mime?.startsWith("video/");
}
function isAudio(mime) {
  return mime?.startsWith("audio/");
}
function isPdf(mime) {
  return mime === "application/pdf";
}

function truncateText(text = "", max = 90) {
  const t = String(text || "");
  if (t.length <= max) return t;
  return t.slice(0, max).trim() + "…";
}

/* ===================== Reply Preview ===================== */

function ReplyPreview({
  loadingReplayJump,
  replyTo,
  isOwnMessage,
  onJumpToMessage,
}) {
  if (!replyTo) return null;

  const repliedName =
    replyTo?.sender?.name || replyTo?.senderClient?.name || "Unknown";

  const repliedContent = replyTo?.isDeleted
    ? "(Deleted message)"
    : replyTo?.content?.trim()
    ? truncateText(replyTo.content, 110)
    : "(No text)";

  return (
    <Box
      onClick={() => onJumpToMessage?.(replyTo.id)}
      sx={{
        mb: 1,
        px: 1,
        py: 0.75,
        borderRadius: 1,
        cursor: onJumpToMessage ? "pointer" : "default",
        borderLeft: "4px solid",
        borderLeftColor: isOwnMessage
          ? "rgba(255,255,255,0.8)"
          : "primary.main",
        bgcolor: isOwnMessage
          ? "rgba(255,255,255,0.12)"
          : "rgba(25,118,210,0.08)",
        position: "relative",
      }}
    >
      {loadingReplayJump && (
        <Box sx={{ position: "absolute", top: 8, right: 8 }}>
          <CircularProgress size={12} />
        </Box>
      )}
      <Typography
        variant="caption"
        sx={{
          display: "block",
          fontWeight: 700,
          opacity: isOwnMessage ? 0.95 : 0.9,
        }}
      >
        Replying to {repliedName}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          display: "block",
          opacity: isOwnMessage ? 0.85 : 0.8,
        }}
      >
        {repliedContent}
      </Typography>
    </Box>
  );
}

/* ===================== Media Renderer ===================== */

function MediaRenderer({ file }) {
  const [open, setOpen] = useState(false);
  const { icon: Icon, color, label } = getFileConfig(file.fileMimeType);

  if (isImage(file.fileMimeType)) {
    return (
      <>
        <Box
          component="img"
          src={file.fileUrl}
          alt={file.fileName}
          sx={{
            maxWidth: "100%",
            maxHeight: 280,
            borderRadius: 1,
            cursor: "pointer",
          }}
          onClick={() => setOpen(true)}
        />

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="lg"
          fullWidth
          sx={{
            "& .MuiPaper-root": {
              margin: "10px !important",
            },
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            <Box
              component="img"
              src={file.fileUrl}
              alt={file.fileName}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                maxHeight: "90vh",
              }}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (isVideo(file.fileMimeType)) {
    return (
      <>
        <Box sx={{ position: "relative" }}>
          <video
            src={file.fileUrl}
            controls
            style={{ width: "100%", borderRadius: 8 }}
          />
          <IconButton
            onClick={() => setOpen(true)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "rgba(0,0,0,0.6)",
              color: "#fff",
            }}
          >
            <FaPlay />
          </IconButton>
        </Box>

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <video
              src={file.fileUrl}
              controls
              autoPlay
              style={{ width: "100%" }}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (isAudio(file.fileMimeType)) {
    return <audio src={file.fileUrl} controls style={{ width: "100%" }} />;
  }

  if (isPdf(file.fileMimeType)) {
    return (
      <>
        <Box
          onClick={() => setOpen(true)}
          sx={{
            cursor: "pointer",
            border: "1px solid #ddd",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <iframe
            src={file.fileUrl}
            style={{ width: "100%", height: 300, border: "none" }}
          />
        </Box>

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <iframe
              src={file.fileUrl}
              style={{ width: "100%", height: "90vh", border: "none" }}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Chip
      icon={<Icon color={color} />}
      label={`${label} • ${file.fileName}`}
      onClick={() => window.open(file.fileUrl, "_blank")}
      deleteIcon={<FaDownload />}
      onDelete={() => window.open(file.fileUrl, "_blank")}
      variant="outlined"
      sx={{ cursor: "pointer" }}
    />
  );
}

/* ===================== Main Component ===================== */

export function ChatMessage({
  message,
  currentUserId,
  isCurrentUserAdmin,
  currentUserRole,
  room,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onUnPin,
  onJumpToMessage,
  loadingReplayJump,
  setReplyLoaded,
  replyLoaded,
  replayLoadingMessageId,
  setReplayLoadingMessageId,
  onRemoveUnreadCount,
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // ✅ local state for the pulse animation
  const [flashOn, setFlashOn] = useState(false);
  // ✅ local state for unread count auto-remove
  const [showUnreadCount, setShowUnreadCount] = useState(
    message.showUnreadCount || false
  );

  const isOwnMessage =
    message.sender?.id === currentUserId ||
    message.client?.id === currentUserId;

  const isDeleted = Boolean(message.isDeleted);

  // Check if user can pin messages
  const isGroupChat =
    room?.type === "PROJECT_GROUP" ||
    room?.type === "GROUP" ||
    room?.type === "MULTI_PROJECT";
  const canPin = isGroupChat
    ? currentUserRole === "ADMIN" || currentUserRole === "MODERATOR"
    : true;

  const isFileLikeMessage =
    message.type !== "TEXT" && message.type !== "SYSTEM";
  const hasFile = Boolean(message.fileUrl) && isFileLikeMessage;
  const hasContent = Boolean(message.content?.trim());

  // ✅ should pulse when reply is loaded AND this is the target message
  const shouldFlash =
    Boolean(replyLoaded) &&
    String(replayLoadingMessageId) === String(message.id);

  useEffect(() => {
    if (!shouldFlash) return;

    setFlashOn(true);

    const timer = setTimeout(() => {
      setFlashOn(false);

      // ✅ auto reset flags + remove the id after pulse ends
      setReplyLoaded?.(false);
      setReplayLoadingMessageId?.(null);
    }, 1200);

    return () => clearTimeout(timer);
  }, [shouldFlash, setReplyLoaded, setReplayLoadingMessageId]);

  // ✅ auto-remove unread count after 3 seconds
  useEffect(() => {
    if (showUnreadCount) {
      const timer = setTimeout(() => {
        setShowUnreadCount(false);
        onRemoveUnreadCount?.(message.id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showUnreadCount, message.id, onRemoveUnreadCount]);

  if (message.type === "SYSTEM") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
        <Chip label={message.content} size="small" />
      </Box>
    );
  }

  // ✅ Render day divider if needed
  const dayDivider = message.showDayDivider && (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        my: 2,
        position: "sticky",
        top: 0,
        zIndex: 10,
        mx: "auto",
      }}
    >
      <Chip label={message.dayGroup} size="small" variant="outlined" />
    </Box>
  );
  return (
    <>
      {dayDivider}
      {showUnreadCount && message.unreadCount && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            my: 1,
            animation: "fadeOut 0.5s ease-out 2.5s forwards",
            "@keyframes fadeOut": {
              "0%": { opacity: 1 },
              "100%": { opacity: 0 },
            },
          }}
        >
          <Chip
            label={`${message.unreadCount} unread`}
            size="small"
            color="error"
            variant="outlined"
          />
        </Box>
      )}
      <Box
        sx={{
          display: "flex",
          justifyContent: isOwnMessage ? "flex-end" : "flex-start",
          mb: 2,
          gap: 1,
        }}
        id={`message-${message.id}`}
      >
        {!isOwnMessage && (
          <Avatar src={message.sender?.avatar}>
            {message.sender?.name?.[0]}
          </Avatar>
        )}

        <Box
          sx={(theme) => {
            const ringColor = isOwnMessage
              ? alpha(theme.palette.primary.main, 0.65)
              : alpha(theme.palette.primary.main, 0.65);

            const glowColor = isOwnMessage
              ? alpha(theme.palette.primary.main, 0.22)
              : alpha(theme.palette.primary.main, 0.18);

            return {
              maxWidth: "65%",
              p: 1.5,
              pr: isDeleted ? 1.5 : 4,
              borderRadius: 2,
              bgcolor: isOwnMessage ? "action.selected" : "grey.100",
              color: isOwnMessage ? "primary.contrastText" : "text.primary",
              position: "relative",
              overflow: "visible",
              zIndex: 0,

              // keep content above overlays

              // ✅ keyframes (no backgroundColor changes)
              "@keyframes replyGlow": {
                "0%": { opacity: 0, transform: "scale(1)" },
                "35%": { opacity: 1, transform: "scale(1.01)" },
                "100%": { opacity: 0, transform: "scale(1.04)" },
              },
              "@keyframes replyRing": {
                "0%": {
                  opacity: 0,
                  transform: "scale(0.96)",
                  boxShadow: `0 0 0 0 ${alpha(ringColor, 0.0)}`,
                },
                "30%": {
                  opacity: 1,
                  transform: "scale(1)",
                  boxShadow: `0 0 0 10px ${alpha(ringColor, 0.22)}`,
                },
                "100%": {
                  opacity: 0,
                  transform: "scale(1.03)",
                  boxShadow: `0 0 0 18px ${alpha(ringColor, 0.0)}`,
                },
              },

              // ✅ inside soft glow overlay (keeps original bg)
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                pointerEvents: "none",
                opacity: 0,
                transform: "scale(1)",
                background: `radial-gradient(circle at 30% 25%, ${glowColor} 0%, transparent 55%)`,
                willChange: "transform, opacity",
                animation: flashOn ? "replyGlow 1.1s ease-out" : "none",
              },

              // ✅ outside ring pulse
              "&::before": {
                content: '""',
                position: "absolute",
                inset: -6,
                borderRadius: "inherit",
                pointerEvents: "none",
                opacity: 0,
                transform: "scale(0.96)",
                border: `2px solid ${alpha(ringColor, 0.55)}`,
                willChange: "transform, opacity, box-shadow",
                animation: flashOn ? "replyRing 1.1s ease-out" : "none",
              },

              // ✅ reduce motion support
              "@media (prefers-reduced-motion: reduce)": {
                "&::after": { animation: "none" },
                "&::before": { animation: "none" },
              },
            };
          }}
        >
          {/* ✅ Actions (disabled when deleted) */}
          {!isDeleted && (
            <>
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{ position: "absolute", top: 4, right: 4, zIndex: 2 }}
              >
                <FaEllipsisV />
              </IconButton>

              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
              >
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    onReply?.(message);
                  }}
                >
                  <FaReply style={{ marginRight: 8 }} /> Reply
                </MenuItem>

                {canPin && (
                  <MenuItem
                    onClick={() => {
                      setMenuAnchor(null);
                      if (message.isPinned) {
                        onUnPin?.(message);
                      } else {
                        onPin?.(message);
                      }
                    }}
                  >
                    {message.isPinned ? (
                      <>
                        <MdPushPin style={{ marginRight: 8 }} /> Unpin
                      </>
                    ) : (
                      <>
                        <MdPushPin style={{ marginRight: 8 }} /> Pin
                      </>
                    )}
                  </MenuItem>
                )}

                {(isOwnMessage || isCurrentUserAdmin) && (
                  <MenuItem
                    onClick={() => {
                      setMenuAnchor(null);
                      setDeleteConfirm(true);
                    }}
                  >
                    <FaTrash style={{ marginRight: 8 }} /> Delete
                  </MenuItem>
                )}
              </Menu>
            </>
          )}

          {/* ✅ Deleted message UI (no content / no file / no reply preview / no actions) */}
          {isDeleted ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FaTrash style={{ opacity: 0.75 }} />
              <Typography
                variant="body2"
                sx={{
                  fontStyle: "italic",
                  opacity: isOwnMessage ? 0.9 : 0.8,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                This message was deleted
              </Typography>
            </Box>
          ) : (
            <>
              {message.replyTo && (
                <ReplyPreview
                  loadingReplayJump={loadingReplayJump}
                  replyTo={message.replyTo}
                  isOwnMessage={isOwnMessage}
                  onJumpToMessage={onJumpToMessage}
                />
              )}

              {/* ✅ FILE (or non-text) message */}
              {hasFile && (
                <>
                  <MediaRenderer
                    file={{
                      fileUrl: message.fileUrl,
                      fileName: message.fileName,
                      fileMimeType: message.fileMimeType,
                    }}
                  />

                  {/* ✅ if file message still has text content -> render it under the file */}
                  {hasContent && (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {message.content}
                    </Typography>
                  )}
                </>
              )}

              {/* ✅ TEXT message (or non-file message with content) */}
              {!hasFile && hasContent && (
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {message.content}
                </Typography>
              )}
            </>
          )}

          <Typography
            variant="caption"
            sx={{ display: "block", mt: 0.5, opacity: 0.6 }}
          >
            {dayjs(message.createdAt).format("HH:mm")}
            {message.isDeleted
              ? " • deleted"
              : message.isEdited
              ? " • edited"
              : ""}
          </Typography>

          {/* ✅ Delete Confirm (disabled when deleted) */}
          {!isDeleted && (
            <Dialog
              open={deleteConfirm}
              onClose={() => setDeleteConfirm(false)}
            >
              <DialogTitle>Delete message?</DialogTitle>
              <DialogActions>
                <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
                <Button
                  color="error"
                  onClick={() => {
                    setDeleteConfirm(false);
                    onDelete?.(message.id);
                  }}
                >
                  Delete
                </Button>
              </DialogActions>
            </Dialog>
          )}
        </Box>

        {isOwnMessage && (
          <Avatar src={message.sender?.avatar}>
            {message.sender?.name?.[0]}
          </Avatar>
        )}
      </Box>
    </>
  );
}

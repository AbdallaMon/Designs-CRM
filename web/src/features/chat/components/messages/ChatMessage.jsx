"use client";
import { CHAT_MEMBER_ROLES, CHAT_ROOM_TYPES } from "@dms/shared";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Dialog,
  DialogContent,
  CircularProgress,
  Backdrop,
  Skeleton,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  FaEllipsisV,
  FaReply,
  FaTrash,
  FaDownload,
  FaPlay,
  FaFile,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaShare,
  FaCheck,
} from "react-icons/fa";
import { MdPushPin } from "react-icons/md";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FILE_TYPE_CONFIG } from "@/app/helpers/constants";
import { RenderListOfFiles } from "@/shared/components/media/MediaRender.jsx";
import { ReplyPreview } from "@/features/chat/components/messages/ReplyPreview.jsx";
import { MessageActions } from "@/features/chat/components/messages/MessageActions.jsx";

dayjs.extend(relativeTime);

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
  pinnedMessages,
  clientId,
  selectedMessages,
  setSelectedMessages,
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [flashOn, setFlashOn] = useState(false);
  const [showUnreadCount, setShowUnreadCount] = useState(
    message.showUnreadCount || false
  );
  const isSelected = selectedMessages.some((m) => m.id === message.id);
  const isPinned =
    message.isPinned || pinnedMessages?.some((pm) => pm.id === message.id);
  console.log(message, "message");
  const isOwnMessage =
    message.sender?.id === currentUserId ||
    (clientId && message.senderClient == clientId);
  console.log(isOwnMessage, "isOwnMessage");
  const sender = message.sender?.name || message.client?.name || "Unknown";
  const isDeleted = Boolean(message.isDeleted);

  const isGroupChat =
    room?.type === CHAT_ROOM_TYPES.PROJECT_GROUP ||
    room?.type === CHAT_ROOM_TYPES.GROUP ||
    room?.type === CHAT_ROOM_TYPES.STAFF_GROUP;

  const canPin = isGroupChat
    ? currentUserRole === CHAT_MEMBER_ROLES.ADMIN || currentUserRole === CHAT_MEMBER_ROLES.MODERATOR
    : true;

  const canDelete = isOwnMessage || isCurrentUserAdmin;
  const canForward = !message.clientId;
  const hasContent = Boolean(message.content?.trim());

  const attachments = Array.isArray(message.attachments)
    ? message.attachments
    : [];

  const isFileLikeMessage =
    message.type !== "TEXT" && message.type !== "SYSTEM";
  const hasAttachments = isFileLikeMessage && attachments.length > 0;

  const shouldFlash =
    Boolean(replyLoaded) &&
    String(replayLoadingMessageId) === String(message.id);
  function handleSelect() {
    if (isSelected) {
      setSelectedMessages(selectedMessages.filter((m) => m.id !== message.id));
    } else {
      setSelectedMessages([...selectedMessages, message]);
    }
    setMenuAnchor(null);
  }
  useEffect(() => {
    if (!shouldFlash) return;

    setFlashOn(true);

    const timer = setTimeout(() => {
      setFlashOn(false);
      setReplyLoaded?.(false);
      setReplayLoadingMessageId?.(null);
    }, 1200);

    return () => clearTimeout(timer);
  }, [shouldFlash, setReplyLoaded, setReplayLoadingMessageId]);

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
        <Chip
          label={message.content}
          size="small"
          sx={{
            bgcolor: (theme) => alpha(theme.palette.text.primary, 0.06),
            color: "text.secondary",
            fontWeight: 600,
            borderRadius: 1.5,
          }}
        />
      </Box>
    );
  }

  const dayDivider = message.showDayDivider && (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        my: 2,
        position: "sticky",
        top: 4,
        zIndex: 10,
        mx: "auto",
      }}
    >
      <Chip
        label={message.dayGroup}
        size="small"
        sx={{
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          color: "text.secondary",
          fontWeight: 700,
          borderRadius: 1.5,
          boxShadow: 1,
        }}
      />
    </Box>
  );

  return (
    <Box
      sx={{
        backgroundColor: isSelected
          ? "action.selected"
          : flashOn
          ? (theme) => alpha(theme.palette.primary.main, 0.1)
          : "transparent",
        p: 1,
        borderRadius: 2,
        mb: 2,
        position: "relative",
      }}
    >
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
            sx={{ fontWeight: 700, borderRadius: 1.5 }}
          />
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: isOwnMessage ? "flex-end" : "flex-start",
          alignItems: "flex-end",
          gap: 1,
        }}
        id={`message-${message.id}`}
      >
        {!isOwnMessage && (
          <Avatar
            src={message.sender?.profilePicture}
            sx={{ width: 34, height: 34, fontSize: "0.9rem", flexShrink: 0 }}
          >
            {sender?.[0]}
          </Avatar>
        )}

        <Box
          sx={(theme) => {
            const ringColor = alpha(theme.palette.primary.main, 0.65);
            const glowColor = isOwnMessage
              ? alpha(theme.palette.primary.main, 0.22)
              : alpha(theme.palette.primary.main, 0.18);

            return {
              maxWidth: "78%",
              p: 1.5,
              pr: isDeleted ? 1.5 : 4,
              borderRadius: 2.5,
              [isOwnMessage
                ? "borderBottomRightRadius"
                : "borderBottomLeftRadius"]: 6,
              bgcolor: isOwnMessage ? "primary.main" : "background.paper",
              color: isOwnMessage ? "primary.contrastText" : "text.primary",
              border: isOwnMessage ? "none" : "1px solid",
              borderColor: isOwnMessage ? "transparent" : "divider",
              boxShadow: isOwnMessage
                ? `0 1px 2px ${alpha(theme.palette.primary.dark, 0.25)}`
                : theme.shadows[1],
              position: "relative",
              overflow: "visible",
              zIndex: 0,

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

              "@media (prefers-reduced-motion: reduce)": {
                "&::after": { animation: "none" },
                "&::before": { animation: "none" },
              },
            };
          }}
        >
          {!isOwnMessage && (
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                color: "primary.dark",
                fontSize: "0.8rem",
                lineHeight: 1.3,
              }}
            >
              {sender}
            </Typography>
          )}
          {!isDeleted && (
            <>
              <MessageActions
                message={message}
                isPinned={isPinned}
                canPin={canPin}
                canDelete={canDelete}
                onReply={onReply}
                onPin={onPin}
                onUnPin={onUnPin}
                onDelete={onDelete}
                setMenuAnchor={setMenuAnchor}
                menuAnchor={menuAnchor}
                selectedMessages={selectedMessages}
                setSelectedMessages={setSelectedMessages}
                canForward={canForward}
                isSelected={isSelected}
                handleSelect={handleSelect}
              />
            </>
          )}

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

              {hasAttachments ? (
                <>
                  <RenderListOfFiles attachments={attachments} />
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
              ) : (
                hasContent && (
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {message.content}
                  </Typography>
                )
              )}
            </>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mt: 0.5,
              justifyContent: isOwnMessage ? "flex-end" : "flex-start",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                opacity: isOwnMessage ? 0.85 : 0.6,
                color: isOwnMessage ? "primary.contrastText" : "text.secondary",
                fontSize: "0.7rem",
              }}
            >
              {dayjs(message.createdAt).format("HH:mm")}
              {message.isDeleted
                ? " • deleted"
                : message.isEdited
                ? " • edited"
                : ""}
            </Typography>
            {isOwnMessage && !isDeleted && (
              <FaCheck
                size={11}
                style={{ opacity: 0.85, color: "currentColor" }}
              />
            )}
          </Box>
        </Box>

        {isOwnMessage && (
          <Avatar
            src={message.sender?.profilePicture}
            sx={{ width: 34, height: 34, fontSize: "0.9rem", flexShrink: 0 }}
          >
            {message.sender?.name?.[0]}
          </Avatar>
        )}
      </Box>
      {selectedMessages?.length > 0 && !message.isDeleted && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            [isOwnMessage ? "left" : "right"]: 0,
            zIndex: 1,
            width: 16,
            height: 16,
            bgcolor: "background.paper",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: 1,
            transform: "translate(25%, -25%)",
            border: (theme) => `2px solid ${theme.palette.action.selected}`,
            cursor: "pointer",
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
          onClick={handleSelect}
        >
          {isSelected ? (
            <FaCheck style={{ color: "green", width: 16, height: 16 }} />
          ) : null}
        </Box>
      )}
    </Box>
  );
}

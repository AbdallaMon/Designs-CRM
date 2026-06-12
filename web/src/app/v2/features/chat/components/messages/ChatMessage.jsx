"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { FaEllipsisV, FaReply, FaTrash, FaShare, FaCheck } from "react-icons/fa";
import { MdPushPin } from "react-icons/md";
import dayjs from "dayjs";
import { ChatAttachments } from "./ChatAttachments.jsx";
import { useT } from "@/app/v2/lib/i18n";

function truncateText(text = "", max = 90) {
  const t = String(text || "");
  return t.length <= max ? t : t.slice(0, max).trim() + "…";
}

function ReplyPreview({ loadingReplayJump, replyTo, isOwnMessage, onJumpToMessage }) {
  const { t } = useT();
  if (!replyTo) return null;
  const repliedName = replyTo?.sender?.name || replyTo?.senderClient?.name || t("chat.message.unknownSender", "غير معروف");
  const repliedContent = replyTo?.isDeleted
    ? t("chat.message.deletedReply", "(رسالة محذوفة)")
    : replyTo?.content?.trim()
      ? truncateText(replyTo.content, 110)
      : t("chat.message.emptyReply", "(بدون نص)");
  return (
    <Box
      onClick={() => onJumpToMessage?.(replyTo.id)}
      sx={{
        mb: 1,
        px: 1,
        py: 0.75,
        borderRadius: 1,
        cursor: onJumpToMessage ? "pointer" : "default",
        borderInlineStart: "4px solid",
        borderInlineStartColor: isOwnMessage ? "rgba(255,255,255,0.8)" : "primary.main",
        bgcolor: isOwnMessage ? "rgba(255,255,255,0.12)" : "rgba(25,118,210,0.08)",
        position: "relative",
      }}
    >
      {loadingReplayJump && (
        <Box sx={{ position: "absolute", top: 8, insetInlineEnd: 8 }}>
          <CircularProgress size={12} />
        </Box>
      )}
      <Typography variant="caption" sx={{ display: "block", fontWeight: 700 }}>
        {t("chat.message.replyTo", "رد على {name}").replace("{name}", repliedName)}
      </Typography>
      <Typography variant="caption" sx={{ display: "block", opacity: 0.85 }}>
        {repliedContent}
      </Typography>
    </Box>
  );
}

export function ChatMessage({
  message,
  currentUserId,
  isCurrentUserAdmin,
  currentUserRole,
  room,
  onReply,
  onDelete,
  onPin,
  onUnPin,
  onJumpToMessage,
  loadingReplayJump,
  setReplyLoaded,
  replyLoaded,
  replayLoadingMessageId,
  setReplayLoadingMessageId,
  pinnedMessages,
  selectedMessages,
  setSelectedMessages,
}) {
  const { t } = useT();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [flashOn, setFlashOn] = useState(false);

  const isSelected = selectedMessages.some((m) => m.id === message.id);
  const isPinned = message.isPinned || pinnedMessages?.some((pm) => pm.id === message.id);
  const isOwnMessage = message.sender?.id === currentUserId;
  const sender = message.sender?.name || message.client?.name || t("chat.message.unknownSender", "غير معروف");
  const isDeleted = Boolean(message.isDeleted);

  const isGroupChat = ["PROJECT_GROUP", "GROUP", "MULTI_PROJECT"].includes(room?.type);
  const canPin = isGroupChat
    ? currentUserRole === "ADMIN" || currentUserRole === "MODERATOR"
    : true;
  const canDelete = isOwnMessage || isCurrentUserAdmin;
  const canForward = !message.clientId;
  const hasContent = Boolean(message.content?.trim());

  const attachments = Array.isArray(message.attachments) ? message.attachments : [];
  const isFileLikeMessage = message.type !== "TEXT" && message.type !== "SYSTEM";
  const hasAttachments = isFileLikeMessage && attachments.length > 0;

  const shouldFlash =
    Boolean(replyLoaded) && String(replayLoadingMessageId) === String(message.id);

  function handleSelect() {
    setSelectedMessages(
      isSelected
        ? selectedMessages.filter((m) => m.id !== message.id)
        : [...selectedMessages, message],
    );
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

  if (message.type === "SYSTEM") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
        <Chip label={message.content} size="small" />
      </Box>
    );
  }

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
      {message.showDayDivider && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <Chip label={message.dayGroup} size="small" variant="outlined" />
        </Box>
      )}

      <Box
        sx={{ display: "flex", justifyContent: isOwnMessage ? "flex-end" : "flex-start", gap: 1 }}
        id={`message-${message.id}`}
      >
        {!isOwnMessage && <Avatar src={message.sender?.profilePicture}>{sender?.[0]}</Avatar>}

        <Box
          sx={{
            maxWidth: "75%",
            p: 1.5,
            pr: isDeleted ? 1.5 : 4,
            borderRadius: 2,
            bgcolor: isOwnMessage ? "action.selected" : "grey.100",
            color: isOwnMessage ? "primary.contrastText" : "text.primary",
            position: "relative",
          }}
        >
          {!isOwnMessage && (
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, opacity: 0.85 }}>
              {sender}
            </Typography>
          )}

          {!isDeleted && (
            <MessageActions
              message={message}
              isPinned={isPinned}
              canPin={canPin}
              canDelete={canDelete}
              canForward={canForward}
              onReply={onReply}
              onPin={onPin}
              onUnPin={onUnPin}
              onDelete={onDelete}
              setMenuAnchor={setMenuAnchor}
              menuAnchor={menuAnchor}
              selectedMessages={selectedMessages}
              handleSelect={handleSelect}
            />
          )}

          {isDeleted ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FaTrash style={{ opacity: 0.75 }} />
              <Typography variant="body2" sx={{ fontStyle: "italic", opacity: 0.85 }}>
                {t("chat.message.deleted", "تم حذف هذه الرسالة")}
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
                  <ChatAttachments attachments={attachments} />
                  {hasContent && (
                    <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {message.content}
                    </Typography>
                  )}
                </>
              ) : (
                hasContent && (
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {message.content}
                  </Typography>
                )
              )}
            </>
          )}

          <Typography variant="caption" sx={{ display: "block", mt: 0.5, opacity: 0.6 }}>
            {dayjs(message.createdAt).format("HH:mm")}
            {message.isDeleted
              ? t("chat.message.deletedTag", " • محذوفة")
              : message.isEdited
                ? t("chat.message.editedTag", " • معدّلة")
                : ""}
          </Typography>
        </Box>

        {isOwnMessage && (
          <Avatar src={message.sender?.profilePicture}>{message.sender?.name?.[0]}</Avatar>
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
            cursor: "pointer",
          }}
          onClick={handleSelect}
        >
          {isSelected ? <FaCheck style={{ color: "green", width: 16, height: 16 }} /> : null}
        </Box>
      )}
    </Box>
  );
}

function MessageActions({
  message,
  isPinned,
  canPin,
  canDelete,
  canForward,
  onReply,
  onPin,
  onUnPin,
  onDelete,
  setMenuAnchor,
  menuAnchor,
  selectedMessages,
  handleSelect,
}) {
  const { t } = useT();
  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => setMenuAnchor(e.currentTarget)}
        sx={{ position: "absolute", top: 4, insetInlineEnd: 4, zIndex: 2 }}
      >
        <FaEllipsisV />
      </IconButton>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        sx={{ zIndex: 1305 }}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onReply?.(message);
          }}
        >
          <FaReply style={{ marginInlineEnd: 8 }} /> {t("chat.message.actionReply", "رد")}
        </MenuItem>
        {canPin && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              isPinned ? onUnPin?.(message) : onPin?.(message);
            }}
          >
            <MdPushPin style={{ marginInlineEnd: 8 }} /> {isPinned ? t("chat.message.actionUnpin", "إلغاء التثبيت") : t("chat.message.actionPin", "تثبيت")}
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onDelete?.(message.id);
            }}
          >
            <FaTrash style={{ marginInlineEnd: 8 }} /> {t("chat.message.actionDelete", "حذف")}
          </MenuItem>
        )}
        {canForward && !message.isDeleted && (
          <MenuItem onClick={handleSelect}>
            <FaShare style={{ marginInlineEnd: 8 }} />{" "}
            {selectedMessages.some((m) => m.id === message.id) ? t("chat.message.actionDeselect", "إلغاء التحديد") : t("chat.message.actionSelect", "تحديد")}
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

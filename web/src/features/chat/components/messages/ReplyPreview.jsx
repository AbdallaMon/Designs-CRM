"use client";

import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { alpha } from "@mui/material/styles";

/* ===================== Helpers ===================== */

function truncateText(text = "", max = 90) {
  const t = String(text || "");
  if (t.length <= max) return t;
  return t.slice(0, max).trim() + "…";
}

/* ===================== Reply Preview ===================== */

export function ReplyPreview({
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
        px: 1.25,
        py: 0.85,
        borderRadius: 2,
        cursor: onJumpToMessage ? "pointer" : "default",
        borderInlineStart: "3px solid",
        borderInlineStartColor: isOwnMessage
          ? "rgba(255,255,255,0.85)"
          : "primary.main",
        bgcolor: isOwnMessage
          ? "rgba(255,255,255,0.16)"
          : (theme) => alpha(theme.palette.primary.main, 0.08),
        position: "relative",
        transition: "background-color .2s ease",
        "&:hover": onJumpToMessage
          ? {
              bgcolor: isOwnMessage
                ? "rgba(255,255,255,0.24)"
                : (theme) => alpha(theme.palette.primary.main, 0.14),
            }
          : undefined,
      }}
    >
      {loadingReplayJump && (
        <Box sx={{ position: "absolute", top: 8, insetInlineEnd: 8 }}>
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

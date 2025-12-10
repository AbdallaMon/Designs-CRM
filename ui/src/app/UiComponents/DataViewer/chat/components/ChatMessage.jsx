"use client";

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Stack,
  Chip,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  FaEllipsisV,
  FaReply,
  FaEdit,
  FaTrash,
  FaDownload,
} from "react-icons/fa";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function ChatMessage({
  message,
  currentUserId,
  isCurrentUserAdmin,
  onReply,
  onEdit,
  onDelete,
  isEditing = false,
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editText, setEditText] = useState(message.content || "");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const isOwnMessage =
    (message.sender?.id === currentUserId && message.type !== "SYSTEM") ||
    (message.client?.id === currentUserId && message.type !== "SYSTEM");

  const handleMenuOpen = (e) => setMenuAnchor(e.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);

  const handleEditSave = () => {
    if (editText.trim()) {
      onEdit(message.id, editText);
    }
  };

  const handleDeleteConfirm = () => {
    onDelete(message.id);
    setDeleteConfirm(false);
  };

  const senderName = message.sender?.name || message.client?.name || "Unknown";
  const senderAvatar = message.sender?.avatar || message.client?.avatar;

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (message.type === "SYSTEM") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
        <Chip
          label={message.content}
          size="small"
          variant="outlined"
          color="default"
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isOwnMessage ? "flex-end" : "flex-start",
        mb: 2,
        gap: 1,
        animation: "fadeIn 0.3s ease-in",
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      {!isOwnMessage && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "scale(1.1)",
              boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
            },
          }}
          src={senderAvatar}
          alt={senderName}
        >
          {senderName.charAt(0)}
        </Avatar>
      )}

      <Box sx={{ maxWidth: "60%", display: "flex", flexDirection: "column" }}>
        {!isOwnMessage && (
          <Typography
            variant="caption"
            sx={{
              mb: 0.5,
              ml: 1,
              fontWeight: 600,
              color: "primary.main",
              letterSpacing: "0.02em",
            }}
          >
            {senderName}
          </Typography>
        )}

        {isEditing ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              multiline
              maxRows={4}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              variant="outlined"
            />
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Button size="small" onClick={handleEditSave}>
                Save
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setEditText(message.content);
                  onEdit(null);
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Paper
            sx={{
              px: 2,
              py: 1.5,
              backgroundColor: isOwnMessage ? "primary.main" : "grey.100",
              color: isOwnMessage ? "primary.contrastText" : "text.primary",
              borderRadius: 3,
              wordBreak: "break-word",
              boxShadow: isOwnMessage
                ? "0 2px 8px rgba(0,0,0,0.1)"
                : "0 1px 4px rgba(0,0,0,0.05)",
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: isOwnMessage
                  ? "0 4px 12px rgba(0,0,0,0.15)"
                  : "0 2px 8px rgba(0,0,0,0.1)",
              },
            }}
          >
            {message.replyTo && (
              <Box
                sx={{
                  mb: 1,
                  pb: 1,
                  borderLeft: `3px solid ${
                    isOwnMessage ? "rgba(255,255,255,0.3)" : "primary.main"
                  }`,
                  pl: 1,
                  opacity: 0.8,
                  fontSize: "0.85rem",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Reply to {message.replyTo.sender?.name}
                </Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                  {message.replyTo.content?.substring(0, 50)}
                  {message.replyTo.content?.length > 50 ? "..." : ""}
                </Typography>
              </Box>
            )}

            {message.type === "TEXT" && (
              <Typography variant="body2">{message.content}</Typography>
            )}

            {message.type === "FILE" && (
              <Stack spacing={0.5}>
                <Typography variant="body2">{message.content}</Typography>
                <Chip
                  label={`📎 ${message.fileName} (${formatFileSize(
                    message.fileSize
                  )})`}
                  onClick={() => window.open(message.fileUrl, "_blank")}
                  deleteIcon={<FaDownload />}
                  onDelete={() => window.open(message.fileUrl, "_blank")}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            )}

            {message.type === "IMAGE" && (
              <Box
                component="img"
                src={message.fileUrl}
                alt="Message image"
                sx={{
                  maxWidth: "100%",
                  maxHeight: 300,
                  borderRadius: 1,
                  cursor: "pointer",
                }}
                onClick={() => window.open(message.fileUrl, "_blank")}
              />
            )}

            {message.isEdited && (
              <Typography
                variant="caption"
                sx={{ display: "block", mt: 0.5, opacity: 0.7 }}
              >
                (edited)
              </Typography>
            )}
          </Paper>
        )}

        <Box sx={{ display: "flex", gap: 1, mt: 0.5, alignItems: "center" }}>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            {dayjs(message.createdAt).format("HH:mm")}
          </Typography>

          {(isOwnMessage || isCurrentUserAdmin) && (
            <Box>
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{
                  opacity: 0.3,
                  transition: "opacity 0.2s ease",
                  "&:hover": { opacity: 1 },
                }}
              >
                <FaEllipsisV size={12} />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => onReply(message)}>
                  <FaReply size={14} style={{ marginRight: 8 }} />
                  Reply
                </MenuItem>
                {isOwnMessage && (
                  <MenuItem onClick={() => onEdit(message.id)}>
                    <FaEdit size={14} style={{ marginRight: 8 }} />
                    Edit
                  </MenuItem>
                )}
                <MenuItem onClick={() => setDeleteConfirm(true)}>
                  <FaTrash size={14} style={{ marginRight: 8 }} />
                  Delete
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Box>

      {isOwnMessage && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "scale(1.1)",
              boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
            },
          }}
          src={senderAvatar}
          alt={senderName}
        >
          {senderName.charAt(0)}
        </Avatar>
      )}

      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>Delete Message?</DialogTitle>
        <DialogContent>
          <Typography>
            This action cannot be undone. Are you sure you want to delete this
            message?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

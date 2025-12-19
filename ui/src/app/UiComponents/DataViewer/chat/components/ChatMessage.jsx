"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Stack,
  Chip,
  Avatar,
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
  FaPlay,
  FaFile,
} from "react-icons/fa";
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

/* ===================== Media Renderer ===================== */

function MediaRenderer({ file }) {
  const [open, setOpen] = useState(false);
  const { icon: Icon, color, label } = getFileConfig(file.fileMimeType);

  /* ---------- IMAGE ---------- */
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
        >
          <DialogContent sx={{ p: 0 }}>
            <Box
              component="img"
              src={file.fileUrl}
              alt={file.fileName}
              sx={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  /* ---------- VIDEO ---------- */
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

  /* ---------- AUDIO ---------- */
  if (isAudio(file.fileMimeType)) {
    return <audio src={file.fileUrl} controls style={{ width: "100%" }} />;
  }

  /* ---------- PDF ---------- */
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

  /* ---------- OTHER FILES ---------- */
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
  onReply,
  onEdit,
  onDelete,
  isEditing = false,
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const isOwnMessage =
    message.sender?.id === currentUserId ||
    message.client?.id === currentUserId;

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
        display: "flex",
        justifyContent: isOwnMessage ? "flex-end" : "flex-start",
        mb: 2,
        gap: 1,
      }}
    >
      {!isOwnMessage && (
        <Avatar src={message.sender?.avatar}>
          {message.sender?.name?.[0]}
        </Avatar>
      )}

      <Box
        sx={{
          maxWidth: "65%",
          p: 1.5,
          pr: 4,
          borderRadius: 2,
          bgcolor: isOwnMessage ? "primary.main" : "grey.100",
          color: isOwnMessage ? "primary.contrastText" : "text.primary",
          position: "relative",
        }}
      >
        {
          <>
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ position: "absolute", top: 4, right: 4 }}
            >
              <FaEllipsisV />
            </IconButton>

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem onClick={() => onReply(message)}>
                <FaReply style={{ marginRight: 8 }} /> Reply
              </MenuItem>
              {isOwnMessage && (
                <MenuItem onClick={() => onEdit(message.id)}>
                  <FaEdit style={{ marginRight: 8 }} /> Edit
                </MenuItem>
              )}
              {(isOwnMessage || isCurrentUserAdmin) && (
                <MenuItem onClick={() => setDeleteConfirm(true)}>
                  <FaTrash style={{ marginRight: 8 }} /> Delete
                </MenuItem>
              )}
            </Menu>
          </>
        }

        {message.type === "TEXT" && (
          <Typography variant="body2">{message.content}</Typography>
        )}

        {message.type !== "TEXT" && message.fileUrl && (
          <MediaRenderer
            file={{
              fileUrl: message.fileUrl,
              fileName: message.fileName,
              fileMimeType: message.fileMimeType,
            }}
          />
        )}

        <Typography
          variant="caption"
          sx={{ display: "block", mt: 0.5, opacity: 0.6 }}
        >
          {dayjs(message.createdAt).format("HH:mm")}
          {message.isEdited && " • edited"}
        </Typography>
      </Box>

      {isOwnMessage && (
        <Avatar src={message.sender?.avatar}>
          {message.sender?.name?.[0]}
        </Avatar>
      )}

      {/* Delete Confirm */}
      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>Delete message?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          <Button color="error" onClick={() => onDelete(message.id)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

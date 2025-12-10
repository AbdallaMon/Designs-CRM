"use client";

import React, { useState, useRef } from "react";
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Stack,
  Chip,
  Paper,
  Typography,
  Button,
  LinearProgress,
} from "@mui/material";
import {
  FaPaperPlane,
  FaPaperclip,
  FaSmile,
  FaTimes,
  FaImage,
} from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import { FILE_UPLOAD_LIMITS } from "../utils/chatConstants";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";

export function ChatInput({
  onSendMessage,
  onReplyingTo = null,
  onCancelReply = () => {},
  loading = false,
  disabled = false,
  onTyping = () => {},
  socketConnected = false,
}) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]); // Multiple files
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [fileError, setFileError] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState({}); // Track progress per file
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);

  const handleSendMessage = async () => {
    if (!message.trim() && selectedFiles.length === 0) return;

    setIsSending(true);

    try {
      // If there are files to upload
      if (selectedFiles.length > 0) {
        // Upload each file and send as separate message
        for (const fileObj of selectedFiles) {
          const { file, id, text } = fileObj;

          // Initialize progress for this file
          setUploadingFiles((prev) => ({ ...prev, [id]: 0 }));

          // Upload file in chunks
          const fileUpload = await uploadInChunks(
            file,
            (progress) => {
              setUploadingFiles((prev) => ({ ...prev, [id]: progress }));
            },
            false, // setOverlay not needed for chat
            true // isClient
          );

          // Only send message if upload successful
          console.log(fileUpload, "fileUpload");
          if (fileUpload?.status === 200) {
            await onSendMessage(text || message, {
              file,
              name: file.name,
              type: file.type,
              fileUrl: fileUpload.url, // Include the uploaded URL
            });
          } else {
            setFileError(`Failed to upload ${file.name}`);
          }

          // Clear progress for this file
          setUploadingFiles((prev) => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
          });
        }

        // Clear form after all uploads
        setSelectedFiles([]);
        setFileError("");
        if (message && message.length > 0) {
          await onSendMessage(message);
        }
      } else {
        // Send text-only message
        await onSendMessage(message);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setFileError("Failed to send message");
    } finally {
      setIsSending(false);
      setMessage("");
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (!files) return;

    setFileError("");
    const newFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > FILE_UPLOAD_LIMITS.MAX_SIZE) {
        setFileError(
          `File "${file.name}" exceeds ${
            FILE_UPLOAD_LIMITS.MAX_SIZE / 1024 / 1024
          }MB limit`
        );
        continue;
      }

      if (!FILE_UPLOAD_LIMITS.ALLOWED_TYPES.includes(file.type)) {
        setFileError(`File type "${file.type}" not allowed`);
        continue;
      }

      // Add file with unique ID and text placeholder
      newFiles.push({
        id: `${Date.now()}-${i}`,
        file,
        text: "",
      });
    }

    // Add new files to existing ones
    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const updateFileText = (fileId, text) => {
    setSelectedFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, text } : f))
    );
  };

  const handleMessageChange = (e) => {
    const newValue = e.target.value;
    setMessage(newValue);
    if (socketConnected && onTyping && newValue.length > 0) {
      onTyping();
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {onReplyingTo && (
        <Paper
          sx={{
            p: 1.5,
            bgcolor: "info.lighter",
            border: "1px solid",
            borderColor: "info.light",
            borderRadius: 2,
            transition: "all 0.2s ease",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Replying to {onReplyingTo.sender?.name}
              </Typography>
              <Typography variant="body2">
                {onReplyingTo.content?.substring(0, 50)}
                {onReplyingTo.content?.length > 50 ? "..." : ""}
              </Typography>
            </Box>
            <IconButton size="small" onClick={onCancelReply}>
              <FaTimes size={14} />
            </IconButton>
          </Stack>
        </Paper>
      )}

      {selectedFiles && selectedFiles.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {selectedFiles.map((fileObj) => (
            <Paper
              key={fileObj.id}
              sx={{
                p: 1.5,
                bgcolor: "info.lighter",
                border: "1px solid",
                borderColor: "info.light",
                borderRadius: 2,
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                },
              }}
            >
              <Stack direction="row" justifyContent="space-between" gap={1.5}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {/* File name and size */}
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    📎 {fileObj.file.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>

                  {/* Text input for this file */}
                  <TextField
                    fullWidth
                    multiline
                    maxRows={2}
                    size="small"
                    placeholder="Optional text for this file..."
                    value={fileObj.text}
                    onChange={(e) => updateFileText(fileObj.id, e.target.value)}
                    disabled={isSending}
                    variant="standard"
                    sx={{ mb: uploadingFiles[fileObj.id] ? 1 : 0 }}
                  />

                  {/* Upload progress */}
                  {uploadingFiles[fileObj.id] !== undefined && (
                    <Stack gap={0.5}>
                      <LinearProgress
                        variant="determinate"
                        value={uploadingFiles[fileObj.id]}
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {uploadingFiles[fileObj.id]}%
                      </Typography>
                    </Stack>
                  )}
                </Box>

                {/* Remove button */}
                <IconButton
                  size="small"
                  onClick={() => removeFile(fileObj.id)}
                  disabled={
                    isSending || uploadingFiles[fileObj.id] !== undefined
                  }
                >
                  <FaTimes size={14} />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Box>
      )}

      {fileError && (
        <Paper sx={{ p: 1, bgcolor: "error.lighter", color: "error.main" }}>
          <Typography variant="caption">{fileError}</Typography>
        </Paper>
      )}

      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder="Type a message... (Shift+Enter for new line)"
        value={message}
        onChange={handleMessageChange}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        variant="outlined"
        size="small"
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "action.hover",
            },
            "&.Mui-focused": {
              bgcolor: "background.paper",
            },
          },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Tooltip title="Attach files (multi-select)" arrow>
                  <IconButton
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || loading || isSending}
                    sx={{
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "action.hover",
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    <FaPaperclip size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Emoji" arrow>
                  <IconButton
                    size="small"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    disabled={disabled || loading || isSending}
                    sx={{
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "action.hover",
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    <FaSmile size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Send" arrow>
                  <IconButton
                    size="small"
                    onClick={handleSendMessage}
                    disabled={
                      disabled ||
                      loading ||
                      isSending ||
                      (!message.trim() && selectedFiles.length === 0)
                    }
                    color="primary"
                    sx={{
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        transform: "scale(1.1)",
                      },
                      "&:disabled": {
                        opacity: 0.4,
                      },
                    }}
                  >
                    {loading || isSending ? (
                      <CircularProgress size={20} />
                    ) : (
                      <FaPaperPlane size={18} />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            </InputAdornment>
          ),
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        onChange={handleFileSelect}
        accept={FILE_UPLOAD_LIMITS.ALLOWED_TYPES.join(",")}
      />

      {showEmojiPicker && (
        <Box sx={{ position: "relative", zIndex: 1000 }}>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            height={300}
            width="100%"
          />
        </Box>
      )}
    </Box>
  );
}

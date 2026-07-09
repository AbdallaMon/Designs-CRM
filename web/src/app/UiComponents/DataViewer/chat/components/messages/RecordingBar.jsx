"use client";

import React from "react";
import {
  Box,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  Paper,
  Typography,
  LinearProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { FaPaperPlane, FaStop, FaTrash } from "react-icons/fa";
import { WaveBars } from "./WaveBars";

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function RecordingBar({
  status, // "recording" | "recorded"
  seconds,
  audioUrl,
  onStop,
  onCancel,
  onSend,
  sending,
  uploadProgress,
  error,
}) {
  const isRecording = status === "recording";
  const isRecorded = status === "recorded";

  return (
    <Paper
      sx={{
        p: 1.25,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: "error.main",
              boxShadow: isRecording
                ? "0 0 0 6px rgba(211,47,47,0.18)"
                : "none",
              transition: "all 0.2s ease",
            }}
          />
          <WaveBars active={isRecording} />
          <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 60 }}>
            {formatTime(seconds)}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" gap={0.5}>
          <Tooltip title="Cancel" arrow>
            <span>
              <IconButton size="small" onClick={onCancel} disabled={sending}>
                <FaTrash size={16} />
              </IconButton>
            </span>
          </Tooltip>

          {isRecording ? (
            <Tooltip title="Stop" arrow>
              <span>
                <IconButton
                  size="small"
                  onClick={onStop}
                  disabled={sending}
                  color="error"
                >
                  <FaStop size={16} />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title="Send voice" arrow>
              <span>
                <IconButton
                  size="small"
                  onClick={onSend}
                  disabled={sending}
                  color="primary"
                  sx={{
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      transform: "scale(1.08)",
                    },
                  }}
                >
                  {sending ? (
                    <CircularProgress size={18} />
                  ) : (
                    <FaPaperPlane size={16} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {isRecorded && audioUrl && (
        <Box sx={{ mt: 1 }}>
          <audio controls src={audioUrl} style={{ width: "100%" }} />
        </Box>
      )}

      {typeof uploadProgress === "number" && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            sx={{ height: 4, borderRadius: 2 }}
          />
          <Typography variant="caption" color="textSecondary">
            {uploadProgress}%
          </Typography>
        </Box>
      )}

      {error && (
        <Paper
          elevation={0}
          sx={{
            mt: 1,
            p: 1,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
            color: "error.main",
          }}
        >
          <Typography variant="caption">{error}</Typography>
        </Paper>
      )}
    </Paper>
  );
}

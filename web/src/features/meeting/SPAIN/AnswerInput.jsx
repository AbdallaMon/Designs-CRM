"use client";

import React, { useState } from "react";
import {
  Button,
  Box,
  TextField,
  CircularProgress,
  Fade,
  Tooltip,
  alpha,
} from "@mui/material";

import { MdSend } from "react-icons/md";

// Modern Answer Input Component with Hover Animation
export const AnswerInput = ({ sessionQuestion, onSubmitAnswer }) => {
  const [answer, setAnswer] = useState(sessionQuestion.answer?.response || "");
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    setLocalSubmitting(true);
    try {
      await onSubmitAnswer(sessionQuestion.id, answer);
    } finally {
      setLocalSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        mt: 2,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform:
          isHovered || isFocused ? "translateY(-2px)" : "translateY(0)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "flex-start",
          p: 2,
          borderRadius: 3,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.02
            )} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
          border: (theme) =>
            `1px solid ${
              isFocused
                ? theme.palette.primary.main
                : isHovered
                ? alpha(theme.palette.primary.main, 0.3)
                : alpha(theme.palette.divider, 0.12)
            }`,
          backdropFilter: "blur(10px)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: (theme) =>
            isHovered || isFocused
              ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.12)}`
              : `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
        }}
      >
        <TextField
          fullWidth
          multiline
          minRows={2}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Answer"
          variant="standard"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: "1rem",
              lineHeight: 1.6,
              "& .MuiInputBase-input": {
                padding: 0,
              },
              "& .MuiInputBase-input::placeholder": {
                opacity: 0.6,
                fontStyle: "italic",
              },
            },
          }}
          sx={{ flex: 1 }}
        />

        <Fade in={isHovered || isFocused || answer.trim().length > 0}>
          <Tooltip title="Submit your answer" placement="top">
            <Box>
              <Button
                variant="contained"
                size="medium"
                onClick={handleSubmit}
                disabled={!answer.trim() || localSubmitting}
                startIcon={
                  localSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <MdSend />
                  )
                }
                sx={{
                  minWidth: 120,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: (theme) =>
                    `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: (theme) =>
                      `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  },
                  "&:disabled": {
                    background: (theme) =>
                      alpha(theme.palette.action.disabled, 0.12),
                  },
                }}
              >
                {localSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </Box>
          </Tooltip>
        </Fade>
      </Box>
    </Box>
  );
};

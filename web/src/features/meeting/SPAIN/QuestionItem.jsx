"use client";

import React, { useState } from "react";
import {
  Button,
  Typography,
  Box,
  Chip,
  Stack,
  alpha,
  Collapse,
  IconButton,
} from "@mui/material";

import {
  MdEdit,
  MdLightbulbOutline,
  MdCheckCircle,
  MdExpandMore,
} from "react-icons/md";

import { FAB_QUESTIONS_WITH_ANSWERS_AR } from "@/app/helpers/constants";
import { AnswerInput } from "@/features/meeting/SPAIN/AnswerInput.jsx";

// Calm question card. When answered it collapses to a compact one-line row (check +
// title + first line of the answer) so the meeting screen stays focused — tap to edit.
// Unanswered questions show the editor directly. The "Suggested reply" hint renders
// inline (only when we actually have a suggestion for this question).
export const QuestionItem = ({ sessionQuestion, onSubmitAnswer }) => {
  const [showHint, setShowHint] = useState(false);
  const accent = sessionQuestion.isCustom ? "warning" : "primary";

  const savedResponse = sessionQuestion.answer?.response?.trim() || "";
  const answered = savedResponse.length > 0;
  const [editing, setEditing] = useState(false);
  const showEditor = !answered || editing;

  const suggestion = FAB_QUESTIONS_WITH_ANSWERS_AR[sessionQuestion.title];

  // Exit edit mode once this question saves successfully (parent returns the envelope).
  const handleSubmit = async (id, content) => {
    const res = await onSubmitAnswer(id, content);
    if (res?.status === 200) setEditing(false);
    return res;
  };

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderInlineStart: (theme) =>
          `3px solid ${theme.palette[answered ? "success" : accent].main}`,
        bgcolor: "background.paper",
        p: 1.75,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: showEditor ? 1 : 0 }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ flex: 1, minWidth: 0 }}
        >
          {answered && (
            <Box
              sx={{ color: "success.main", display: "flex", flexShrink: 0 }}
              aria-label="Answered"
            >
              <MdCheckCircle size={18} />
            </Box>
          )}
          <Typography
            variant="subtitle2"
            fontWeight={700}
            dir="auto"
            sx={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}
          >
            {sessionQuestion.title}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          {sessionQuestion.isCustom && (
            <Chip
              label="Custom"
              size="small"
              icon={<MdEdit />}
              sx={{
                fontWeight: 600,
                borderRadius: 1.5,
                color: "warning.main",
                bgcolor: (theme) => alpha(theme.palette.warning.main, 0.12),
                border: (theme) =>
                  `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                "& .MuiChip-icon": { color: "warning.main" },
              }}
            />
          )}
          {suggestion && showEditor && (
            <Button
              onClick={() => setShowHint((v) => !v)}
              size="small"
              variant="text"
              color="inherit"
              startIcon={<MdLightbulbOutline />}
              sx={{ color: "text.secondary", textTransform: "none" }}
            >
              Suggested reply
            </Button>
          )}
          {answered && !editing && (
            <IconButton
              size="small"
              onClick={() => setEditing(true)}
              aria-label="Edit answer"
            >
              <MdExpandMore />
            </IconButton>
          )}
        </Stack>
      </Stack>

      {/* Answered + not editing → compact preview of the saved answer (tap to edit). */}
      {answered && !editing && (
        <Box
          onClick={() => setEditing(true)}
          sx={{ cursor: "pointer", pl: { xs: 0, sm: "26px" }, mt: 0.5 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            dir="auto"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {savedResponse}
          </Typography>
        </Box>
      )}

      {suggestion && showEditor && (
        <Collapse in={showHint}>
          <Box
            dir="auto"
            sx={{
              mb: 1.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              color: "text.primary",
            }}
          >
            <Typography variant="body2">{suggestion}</Typography>
          </Box>
        </Collapse>
      )}

      {showEditor && (
        <AnswerInput
          sessionQuestion={sessionQuestion}
          onSubmitAnswer={handleSubmit}
        />
      )}
    </Box>
  );
};

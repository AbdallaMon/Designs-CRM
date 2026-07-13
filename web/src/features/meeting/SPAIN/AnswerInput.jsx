"use client";

import React, { useState } from "react";
import {
  Button,
  Box,
  TextField,
  CircularProgress,
  Stack,
  Typography,
  alpha,
} from "@mui/material";

import { MdSend, MdCheckCircle } from "react-icons/md";

// Calm answer input: a plain bordered textarea + a Submit button, with a small
// saved / unsaved status caption. Submitting saves ONLY this question — the parent
// updates just this item in place, so drafts in sibling questions are never lost.
export const AnswerInput = ({ sessionQuestion, onSubmitAnswer }) => {
  const savedResponse = sessionQuestion.answer?.response ?? "";
  const [answer, setAnswer] = useState(savedResponse);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const trimmed = answer.trim();
  const isDirty = trimmed !== savedResponse.trim();
  const isSaved = savedResponse.trim().length > 0 && !isDirty;

  const handleSubmit = async () => {
    if (!trimmed || !isDirty) return;

    setLocalSubmitting(true);
    try {
      await onSubmitAnswer(sessionQuestion.id, answer);
    } finally {
      setLocalSubmitting(false);
    }
  };

  return (
    <Stack spacing={1}>
      <TextField
        fullWidth
        multiline
        minRows={2}
        size="small"
        dir="auto"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Answer"
      />
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
      >
        <StatusCaption
          submitting={localSubmitting}
          dirty={isDirty && trimmed.length > 0}
          saved={isSaved}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          disabled={!trimmed || !isDirty || localSubmitting}
          startIcon={
            localSubmitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <MdSend />
            )
          }
          sx={{ textTransform: "none", fontWeight: 600, flexShrink: 0 }}
        >
          {localSubmitting ? "Saving..." : isSaved ? "Update" : "Submit"}
        </Button>
      </Stack>
    </Stack>
  );
};

const StatusCaption = ({ submitting, dirty, saved }) => {
  if (submitting) {
    return (
      <Typography variant="caption" color="text.secondary">
        Saving…
      </Typography>
    );
  }
  if (dirty) {
    return (
      <Typography variant="caption" color="warning.main" fontWeight={600}>
        Unsaved
      </Typography>
    );
  }
  if (saved) {
    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          px: 1,
          py: 0.25,
          borderRadius: 1.5,
          color: "success.main",
          bgcolor: (theme) => alpha(theme.palette.success.main, 0.12),
        }}
      >
        <MdCheckCircle size={14} />
        <Typography variant="caption" fontWeight={600}>
          Saved
        </Typography>
      </Box>
    );
  }
  return <span />;
};

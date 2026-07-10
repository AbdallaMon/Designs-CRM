"use client";

import React, { useState } from "react";
import { Button, Box, TextField, CircularProgress, Stack } from "@mui/material";

import { MdSend } from "react-icons/md";

// Calm answer input: a plain bordered textarea + a Submit button. No blur/gradient/lift.
export const AnswerInput = ({ sessionQuestion, onSubmitAnswer }) => {
  const [answer, setAnswer] = useState(sessionQuestion.answer?.response || "");
  const [localSubmitting, setLocalSubmitting] = useState(false);

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
    <Stack spacing={1} alignItems="flex-end">
      <TextField
        fullWidth
        multiline
        minRows={2}
        size="small"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Answer"
      />
      <Box>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          disabled={!answer.trim() || localSubmitting}
          startIcon={
            localSubmitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <MdSend />
            )
          }
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {localSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </Box>
    </Stack>
  );
};

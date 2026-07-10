"use client";

import React, { useState } from "react";
import {
  Button,
  Typography,
  Box,
  Chip,
  Stack,
  alpha,
  Dialog,
  DialogContent,
} from "@mui/material";

import { MdEdit, MdInfoOutline } from "react-icons/md";

import { FAB_QUESTIONS_WITH_ANSWERS_AR } from "@/app/helpers/constants";
import { AnswerInput } from "@/features/meeting/SPAIN/AnswerInput.jsx";

// Calm question card: accent rail (amber for custom), title, quiet FAB link, answer field.
export const QuestionItem = ({ sessionQuestion, onSubmitAnswer }) => {
  const [openFABDialog, setOpenFABDialog] = useState(false);
  const accent = sessionQuestion.isCustom ? "warning" : "primary";

  return (
    <>
      <Box
        sx={{
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderLeft: (theme) => `3px solid ${theme.palette[accent].main}`,
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
          sx={{ mb: 1 }}
        >
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}
          >
            {sessionQuestion.title}
          </Typography>

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
            <Button
              onClick={() => setOpenFABDialog(true)}
              size="small"
              variant="text"
              color="inherit"
              endIcon={<MdInfoOutline />}
              sx={{ color: "text.secondary", textTransform: "none" }}
            >
              FAB
            </Button>
          </Stack>
        </Stack>

        <AnswerInput
          sessionQuestion={sessionQuestion}
          onSubmitAnswer={onSubmitAnswer}
        />
      </Box>

      <Dialog open={openFABDialog} onClose={() => setOpenFABDialog(false)}>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ direction: "rtl" }}>
            {FAB_QUESTIONS_WITH_ANSWERS_AR[sessionQuestion.title]}
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
};

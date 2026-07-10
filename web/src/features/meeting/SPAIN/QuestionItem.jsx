"use client";

import React, { useState } from "react";
import {
  Button,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  alpha,
  Dialog,
  DialogContent,
} from "@mui/material";

import {
  MdEdit,
  MdQuestionAnswer,
  MdAutoAwesome,
  MdInfoOutline,
} from "react-icons/md";

import { FAB_QUESTIONS_WITH_ANSWERS_AR } from "@/app/helpers/constants";
import { AnswerInput } from "@/features/meeting/SPAIN/AnswerInput.jsx";

// Modern Question Item with Glassmorphism Effect
export const QuestionItem = ({ sessionQuestion, onSubmitAnswer }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [openFABDialog, setOpenFABDialog] = useState(false);

  const handleOpenFABDialog = () => setOpenFABDialog(true);
  const handleCloseFABDialog = () => setOpenFABDialog(false);

  return (
    <>
      <Card
        sx={{
          mb: 2,
          "&.MuiPaper-root": {
            mt: 2,
          },
          borderRadius: 4,
          overflow: "hidden",
          transition: "all 0.3s",
          transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent sx={{ p: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 1 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                background: (theme) =>
                  sessionQuestion.isCustom
                    ? `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`
                    : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {sessionQuestion.isCustom ? <MdAutoAwesome /> : <MdQuestionAnswer />}
            </Box>

            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  lineHeight: 1.4,
                  mb: 0.5,
                  color: (theme) => theme.palette.text.primary,
                }}
              >
                {sessionQuestion.title}
              </Typography>

              <Button
                onClick={handleOpenFABDialog}
                variant="outlined"
                sx={{ color: "text.secondary",display:"flex",gap:2,alignItems:"center" }}
                endIcon={     <MdInfoOutline  />
}
              >
                FAB
              </Button>
            </Box>

            {sessionQuestion.isCustom && (
              <Chip
                label="Custom Question"
                size="small"
                icon={<MdEdit />}
                sx={{
                  background: (theme) =>
                    `linear-gradient(135deg, ${alpha(
                      theme.palette.warning.main,
                      0.1
                    )} 0%, ${alpha(theme.palette.warning.light, 0.2)} 100%)`,
                  color: (theme) => theme.palette.warning.main,
                  border: (theme) =>
                    `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                  fontWeight: 500,
                }}
              />
            )}
          </Box>

          <AnswerInput
            sessionQuestion={sessionQuestion}
            onSubmitAnswer={onSubmitAnswer}
          />
        </CardContent>
      </Card>

      <Dialog open={openFABDialog} onClose={handleCloseFABDialog}>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{direction:"rtl"}}>
            {FAB_QUESTIONS_WITH_ANSWERS_AR[sessionQuestion.title]}
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
};

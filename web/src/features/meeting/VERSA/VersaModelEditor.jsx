"use client";

import React from "react";
import {
  Typography,
  Box,
  IconButton,
  Container,
  Stack,
  alpha,
} from "@mui/material";

import { MdArrowBack } from "react-icons/md";

import { VersaStep } from "@/features/meeting/VERSA/VersaStep.jsx";

// Calm fullscreen model editor: header bar (back · title · V→E→R→S→A) then the 5 steps.
export const VersaModelEditor = ({ category, versaData, onSave, onClose }) => {
  const versaSteps = ["v", "e", "r", "s", "a"];

  const handleSaveStep = async (stepKey, stepData) => {
    await onSave(category.id, stepKey, stepData);
  };

  return (
    <>
      {/* Calm header bar */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1.5,
          bgcolor: "background.paper",
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <IconButton edge="start" onClick={onClose} aria-label="Back">
          <MdArrowBack />
        </IconButton>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
            color: "primary.main",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          VERSA
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} noWrap>
            {category.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Validate → Empathize → Reframe → Show value → Ask
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ bgcolor: "background.default", minHeight: "100%" }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {versaData && (
            <Stack spacing={2}>
              {versaSteps.map((stepKey) => (
                <VersaStep
                  key={stepKey}
                  step={versaData?.[stepKey]}
                  stepKey={stepKey}
                  onSave={handleSaveStep}
                />
              ))}
            </Stack>
          )}
        </Container>
      </Box>
    </>
  );
};

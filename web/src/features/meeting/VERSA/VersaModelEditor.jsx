"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Box,
  IconButton,
  Container,
  Stack,
  Button,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";

import {
  MdArrowBack,
  MdChevronLeft,
  MdChevronRight,
  MdCheck,
} from "react-icons/md";

import { VersaStep, STEP_CONFIG } from "@/features/meeting/VERSA/VersaStep.jsx";

const VERSA_STEPS = ["v", "e", "r", "s", "a"];

const isFilled = (step) =>
  Boolean(step && (step.question || step.answer || step.clientResponse));

// Calm fullscreen model editor. Instead of stacking all 5 steps (15 fields), it shows a
// V→E→R→S→A rail and ONE active step at a time. Navigating between beats auto-saves the
// current one via the step's flush() — no lost work, no blocking prompt.
export const VersaModelEditor = ({ category, versaData, onClose }) => {
  const theme = useTheme();
  const stepRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  // Local mirror of step content so the rail's filled/check state updates on save.
  const [data, setData] = useState(versaData);

  useEffect(() => {
    setData(versaData);
  }, [versaData]);

  const handleSaved = (stepKey, formData) => {
    setData((prev) => ({ ...prev, [stepKey]: { ...prev[stepKey], ...formData } }));
  };

  const goTo = async (idx) => {
    if (idx === activeStep || idx < 0 || idx > VERSA_STEPS.length - 1) return;
    if (stepRef.current) await stepRef.current.flush();
    setActiveStep(idx);
  };

  const activeKey = VERSA_STEPS[activeStep];
  const prevKey = VERSA_STEPS[activeStep - 1];
  const nextKey = VERSA_STEPS[activeStep + 1];

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
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
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
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            color: "primary.main",
            fontWeight: 700,
            fontSize: 12,
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
        <Container maxWidth="md" sx={{ py: 3 }}>
          {/* Step rail */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Stack direction="row" spacing={{ xs: 0.75, sm: 1.25 }} alignItems="center">
              {VERSA_STEPS.map((key, idx) => {
                const color = theme.palette[STEP_CONFIG[key].colorKey].main;
                const filled = isFilled(data?.[key]);
                const active = idx === activeStep;
                return (
                  <Tooltip
                    key={key}
                    arrow
                    title={
                      <Box sx={{ py: 0.25 }}>
                        <Typography variant="caption" fontWeight={700}>
                          {STEP_CONFIG[key].label}
                        </Typography>
                        <Typography
                          variant="caption"
                          component="div"
                          sx={{ opacity: 0.85, lineHeight: 1.3, mt: 0.25 }}
                        >
                          {STEP_CONFIG[key].description}
                        </Typography>
                        {filled && (
                          <Typography
                            variant="caption"
                            component="div"
                            sx={{ mt: 0.5, fontWeight: 700 }}
                          >
                            ✓ Filled
                          </Typography>
                        )}
                      </Box>
                    }
                  >
                    <Box
                      onClick={() => goTo(idx)}
                      role="button"
                      tabIndex={0}
                      aria-label={STEP_CONFIG[key].label}
                      aria-current={active}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          goTo(idx);
                        }
                      }}
                      sx={{
                        position: "relative",
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        color,
                        bgcolor: alpha(color, active || filled ? 0.16 : 0.06),
                        border: active
                          ? `2px solid ${color}`
                          : `1px solid ${alpha(color, 0.25)}`,
                        transition: "background-color .15s ease",
                      }}
                    >
                      {key.toUpperCase()}
                      {filled && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: -4,
                            insetInlineEnd: -4,
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            bgcolor: "success.main",
                            color: "success.contrastText",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `2px solid ${theme.palette.background.default}`,
                          }}
                        >
                          <MdCheck size={9} />
                        </Box>
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              sx={{ flexShrink: 0 }}
            >
              Step {activeStep + 1} of {VERSA_STEPS.length}
            </Typography>
          </Stack>

          {/* Active step */}
          {data?.[activeKey] && (
            <VersaStep
              key={activeKey}
              ref={stepRef}
              step={data[activeKey]}
              stepKey={activeKey}
              onSaved={handleSaved}
            />
          )}

          {/* Prev / Next */}
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ mt: 2 }}
            spacing={1}
          >
            <Button
              variant="text"
              disabled={activeStep === 0}
              startIcon={<MdChevronLeft />}
              onClick={() => goTo(activeStep - 1)}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              {prevKey ? STEP_CONFIG[prevKey].label : "Back"}
            </Button>
            <Button
              variant="contained"
              disabled={activeStep === VERSA_STEPS.length - 1}
              endIcon={<MdChevronRight />}
              onClick={() => goTo(activeStep + 1)}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              {nextKey ? STEP_CONFIG[nextKey].label : "Done"}
            </Button>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

"use client";

// Presentational shell for the contract create / clone stepper dialogs. Pure UI:
// a clean gradient header that shows the active step + a slim progress bar, and a
// horizontal step rail. No logic, no state — the dialogs own the stepper state and
// pass the active index in.

import React from "react";
import {
  Dialog,
  DialogTitle,
  Box,
  Stack,
  Typography,
  LinearProgress,
  IconButton,
  alpha,
  useTheme,
} from "@mui/material";
import { MdClose } from "react-icons/md";
import { FaCheck } from "react-icons/fa";

/** Dialog frame with a branded header (icon · title · subtitle · step counter · progress). */
export function ContractDialogShell({
  open,
  onClose,
  icon,
  title,
  subtitle,
  activeStep,
  steps,
  children,
}) {
  const theme = useTheme();
  const total = steps.length;
  const pct = total > 1 ? (activeStep / (total - 1)) * 100 : 100;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      <DialogTitle
        component="div"
        sx={{
          p: 0,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ p: 2.25 }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha("#fff", 0.18),
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" fontWeight={800} noWrap sx={{ color: "inherit" }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: alpha("#fff", 0.85) }} noWrap>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              px: 1.25,
              py: 0.4,
              borderRadius: 2,
              bgcolor: alpha("#fff", 0.18),
              fontWeight: 700,
              fontSize: "0.8rem",
              whiteSpace: "nowrap",
            }}
          >
            Step {activeStep + 1} / {total}
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: "inherit", "&:hover": { bgcolor: alpha("#fff", 0.15) } }}
          >
            <MdClose />
          </IconButton>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 4,
            bgcolor: alpha("#fff", 0.2),
            "& .MuiLinearProgress-bar": { bgcolor: "#fff" },
          }}
        />
      </DialogTitle>
      {children}
    </Dialog>
  );
}

/** Horizontal step rail: numbered/checked circles + labels + connectors. */
export function StepRail({ steps, activeStep }) {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="center"
      sx={{ width: "100%" }}
    >
      {steps.map((label, idx) => {
        const done = idx < activeStep;
        const current = idx === activeStep;
        const color = done
          ? theme.palette.success.main
          : current
          ? theme.palette.primary.main
          : theme.palette.text.disabled;
        return (
          <React.Fragment key={label}>
            <Stack alignItems="center" spacing={0.75} sx={{ minWidth: 72 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: done || current ? "#fff" : "text.secondary",
                  bgcolor:
                    done || current ? color : alpha(theme.palette.text.disabled, 0.12),
                  border: `2px solid ${
                    current ? color : "transparent"
                  }`,
                  boxShadow: current ? `0 0 0 4px ${alpha(color, 0.15)}` : "none",
                  transition: "all .25s ease",
                }}
              >
                {done ? <FaCheck size={13} /> : idx + 1}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: current ? 700 : 600,
                  color: current ? "primary.main" : "text.secondary",
                  textAlign: "center",
                }}
              >
                {label}
              </Typography>
            </Stack>
            {idx < steps.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  maxWidth: 90,
                  height: 2,
                  mt: "16px",
                  borderRadius: 1,
                  bgcolor: idx < activeStep
                    ? theme.palette.success.main
                    : alpha(theme.palette.text.disabled, 0.25),
                  transition: "background-color .25s ease",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </Stack>
  );
}

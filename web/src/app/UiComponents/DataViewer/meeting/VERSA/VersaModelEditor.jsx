"use client";

import React from "react";
import {
  Button,
  Typography,
  Box,
  IconButton,
  Paper,
  Container,
  AppBar,
  Toolbar,
  Fade,
  useTheme,
  alpha,
} from "@mui/material";

import { MdClose, MdArrowBack } from "react-icons/md";

import { VersaStep } from "@/app/UiComponents/DataViewer/meeting/VERSA/VersaStep.jsx";

// VersaModelEditor Component - Enhanced
export const VersaModelEditor = ({ category, versaData, onSave, onClose }) => {
  const theme = useTheme();
  const versaSteps = ["v", "e", "r", "s", "a"];

  const handleSaveStep = async (stepKey, stepData) => {
    try {
      await onSave(category.id, stepKey, stepData);
    } catch (error) {
      throw error;
    }
  };

  return (
    <>
      <AppBar
        sx={{
          position: "relative",
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
            sx={{
              mr: 2,
              "&:hover": {
                backgroundColor: alpha(theme.palette.common.white, 0.1),
              },
            }}
          >
            <MdArrowBack />
          </IconButton>
          <Box flex={1}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              VERSA Model - {category.title}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Validate → Empathize → Reframe → Show value → Ask
            </Typography>
          </Box>
          <Button
            color="inherit"
            onClick={onClose}
            startIcon={<MdClose />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              "&:hover": {
                backgroundColor: alpha(theme.palette.common.white, 0.1),
              },
            }}
          >
            Close
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.05
          )} 0%, ${alpha(theme.palette.background.default, 1)} 30%)`,
          height: "auto",
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Fade in timeout={500}>
            <Box mb={6} display="flex" gap={2} alignItems="center">
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {category.title}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                }}
              >
                {category.label}
              </Typography>
            </Box>
          </Fade>

          {versaData && (
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  mb: 4,
                }}
              >
                VERSA Steps
              </Typography>
              {versaSteps.map((stepKey, index) => (
                <VersaStep
                  key={stepKey}
                  step={versaData?.[stepKey]}
                  stepKey={stepKey}
                  onSave={handleSaveStep}
                />
              ))}
            </Box>
          )}

          <Fade in timeout={1000}>
            <Paper
              elevation={4}
              sx={{
                p: 4,
                mt: 6,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.05
                )} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <Box display="flex" justifyContent="center" gap={3}>
                <Button
                  variant="outlined"
                  onClick={onClose}
                  size="large"
                  startIcon={<MdArrowBack />}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "1.1rem",
                  }}
                >
                  Back to Categories
                </Button>
              </Box>
            </Paper>
          </Fade>
        </Container>
      </Box>
    </>
  );
};

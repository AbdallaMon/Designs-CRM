"use client";

import React, { useState } from "react";
import {
  Button,
  Typography,
  TextField,
  Box,
  CircularProgress,
  Paper,
  Divider,
  Grow,
  Avatar,
  Stack,
  useTheme,
  alpha,
} from "@mui/material";

import {
  MdSave,
  MdTrendingUp,
  MdHandshake,
  MdSupport,
  MdQuestionAnswer,
  MdPsychology,
} from "react-icons/md";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

// VersaStep Component - Enhanced with theme
export const VersaStep = ({ step, stepKey, onSave }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    question: step?.question || "",
    answer: step?.answer || "",
    clientResponse: step?.clientResponse || "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const { loading, setLoading } = useToastContext();

  const stepConfig = {
    v: {
      label: "Validate",
      color: theme.palette.info.main,
      lightColor: alpha(theme.palette.info.main, 0.1),
      icon: <MdQuestionAnswer />,
      description:
        "Acknowledge the client's concern and show you understand their objection.",
    },
    e: {
      label: "Empathize",
      color: theme.palette.warning.main,
      lightColor: alpha(theme.palette.warning.main, 0.1),
      icon: <MdPsychology />,
      description:
        "Connect emotionally by recognizing the client’s feelings and point of view.",
    },
    r: {
      label: "Reframe",
      color: theme.palette.primary.main,
      lightColor: alpha(theme.palette.primary.main, 0.1),
      icon: <MdHandshake />,
      description:
        "Shift the client’s perspective by presenting the objection in a new light.",
    },
    s: {
      label: "Show value",
      color: theme.palette.success.main,
      lightColor: alpha(theme.palette.success.main, 0.1),
      icon: <MdSupport />,
      description:
        "Demonstrate the unique benefits and solutions your offer provides.",
    },
    a: {
      label: "Ask",
      color: theme.palette.secondary.main,
      lightColor: alpha(theme.palette.secondary.main, 0.1),
      icon: <MdTrendingUp />,
      description:
        "Prompt the client to take the next step or confirm understanding.",
    },
  };

  const currentStep = stepConfig[stepKey];

  const handleSave = async () => {
    const request = await handleRequestSubmit(
      formData,
      setLoading,
      `shared/questions/versa/steps/${step.id}`,
      false,
      "Saving",
      false,
      "PUT"
    );
    if (request.status === 200) {
      if (onSave) {
        await onSave();
      }
      setHasChanges(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  return (
    <Grow in timeout={300}>
      <Paper
        elevation={hasChanges ? 8 : 2}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          background: `linear-gradient(135deg, ${
            currentStep.lightColor
          } 0%, ${alpha(currentStep.color, 0.05)} 100%)`,
          border: `2px solid ${
            hasChanges ? currentStep.color : alpha(currentStep.color, 0.2)
          }`,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: theme.shadows[12],
          },
        }}
      >
        {/* Decorative background element */}
        <Box
          sx={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: `linear-gradient(45deg, ${alpha(
              currentStep.color,
              0.1
            )}, ${alpha(currentStep.color, 0.05)})`,
            zIndex: 0,
          }}
        />

        <Box position="relative" zIndex={1}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={3}
          >
            <Box display="flex" alignItems="center" gap={3}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: currentStep.color,
                  color: "white",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  boxShadow: `0 4px 20px ${alpha(currentStep.color, 0.3)}`,
                }}
              >
                {stepKey.toUpperCase()}
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: currentStep.color,
                    mb: 0.5,
                  }}
                >
                  {currentStep.label}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  {currentStep.description}
                </Typography>
              </Box>
            </Box>

            <Button
              variant={hasChanges ? "contained" : "outlined"}
              size="large"
              sx={{
                minWidth: 140,
                height: 48,
                borderRadius: 3,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
                boxShadow: hasChanges
                  ? `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`
                  : "none",
                ...(hasChanges && {
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                }),
              }}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <MdSave />
                )
              }
              onClick={handleSave}
              disabled={loading || !hasChanges}
            >
              {loading ? "Saving..." : hasChanges ? "Save Changes" : "Saved"}
            </Button>
          </Box>

          <Divider sx={{ mb: 3, bgcolor: alpha(currentStep.color, 0.2) }} />

          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Question (Optional)"
              placeholder="Enter the question you would ask the client..."
              multiline
              rows={2}
              value={formData.question}
              onChange={(e) => handleChange("question", e.target.value)}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: currentStep.color,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: currentStep.color,
                    borderWidth: 2,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: currentStep.color,
                },
              }}
            />

            <TextField
              fullWidth
              label="Your Response (Optional)"
              placeholder="Enter your response or approach..."
              multiline
              rows={3}
              value={formData.answer}
              onChange={(e) => handleChange("answer", e.target.value)}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: currentStep.color,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: currentStep.color,
                    borderWidth: 2,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: currentStep.color,
                },
              }}
            />

            <TextField
              fullWidth
              label="Expected Client Response (Optional)"
              placeholder="What response do you expect from the client..."
              multiline
              rows={2}
              value={formData.clientResponse}
              onChange={(e) => handleChange("clientResponse", e.target.value)}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: currentStep.color,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: currentStep.color,
                    borderWidth: 2,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: currentStep.color,
                },
              }}
            />
          </Stack>
        </Box>
      </Paper>
    </Grow>
  );
};

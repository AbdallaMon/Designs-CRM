"use client";

import React, { useState } from "react";
import {
  Button,
  Typography,
  TextField,
  Box,
  CircularProgress,
  Divider,
  Stack,
  useTheme,
  alpha,
} from "@mui/material";

import { MdSave } from "react-icons/md";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

// Calm VERSA step: a letter tile + label + description, one Save button, 3 fields.
// Step colour is kept only as a thin accent rail so V/E/R/S/A stay distinguishable.
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
      description:
        "Acknowledge the client's concern and show you understand their objection.",
    },
    e: {
      label: "Empathize",
      color: theme.palette.warning.main,
      description:
        "Connect emotionally by recognizing the client’s feelings and point of view.",
    },
    r: {
      label: "Reframe",
      color: theme.palette.primary.main,
      description:
        "Shift the client’s perspective by presenting the objection in a new light.",
    },
    s: {
      label: "Show value",
      color: theme.palette.success.main,
      description:
        "Demonstrate the unique benefits and solutions your offer provides.",
    },
    a: {
      label: "Ask",
      color: theme.palette.secondary.main,
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
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${theme.palette.divider}`,
        borderLeft: `3px solid ${currentStep.color}`,
        bgcolor: "background.paper",
        p: 2.25,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 1.5 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              bgcolor: alpha(currentStep.color, 0.14),
              color: currentStep.color,
            }}
          >
            {stepKey.toUpperCase()}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: currentStep.color }}>
              {currentStep.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentStep.description}
            </Typography>
          </Box>
        </Stack>

        <Button
          variant={hasChanges ? "contained" : "outlined"}
          size="small"
          startIcon={
            loading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <MdSave />
            )
          }
          onClick={handleSave}
          disabled={loading || !hasChanges}
          sx={{ textTransform: "none", fontWeight: 600, flexShrink: 0 }}
        >
          {loading ? "Saving..." : hasChanges ? "Save" : "Saved"}
        </Button>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        <TextField
          fullWidth
          size="small"
          label="Question (Optional)"
          placeholder="Enter the question you would ask the client..."
          multiline
          rows={2}
          value={formData.question}
          onChange={(e) => handleChange("question", e.target.value)}
        />
        <TextField
          fullWidth
          size="small"
          label="Your Response (Optional)"
          placeholder="Enter your response or approach..."
          multiline
          rows={3}
          value={formData.answer}
          onChange={(e) => handleChange("answer", e.target.value)}
        />
        <TextField
          fullWidth
          size="small"
          label="Expected Client Response (Optional)"
          placeholder="What response do you expect from the client..."
          multiline
          rows={2}
          value={formData.clientResponse}
          onChange={(e) => handleChange("clientResponse", e.target.value)}
        />
      </Stack>
    </Box>
  );
};

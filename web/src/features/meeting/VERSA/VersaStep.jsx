"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
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

export const STEP_CONFIG = {
  v: {
    label: "Validate",
    colorKey: "info",
    description:
      "Acknowledge the client's concern and show you understand their objection.",
  },
  e: {
    label: "Empathize",
    colorKey: "warning",
    description:
      "Connect emotionally by recognizing the client’s feelings and point of view.",
  },
  r: {
    label: "Reframe",
    colorKey: "primary",
    description:
      "Shift the client’s perspective by presenting the objection in a new light.",
  },
  s: {
    label: "Show value",
    colorKey: "success",
    description:
      "Demonstrate the unique benefits and solutions your offer provides.",
  },
  a: {
    label: "Ask",
    colorKey: "secondary",
    description:
      "Prompt the client to take the next step or confirm understanding.",
  },
};

// One VERSA step, rendered on its own (the editor shows a single active step at a time).
// Exposes `flush()` so the editor can auto-save an unsaved step when the rep navigates
// to another beat — no data loss, no blocking prompt mid-meeting.
export const VersaStep = forwardRef(({ step, stepKey, onSaved }, ref) => {
  const theme = useTheme();
  const color = theme.palette[STEP_CONFIG[stepKey].colorKey].main;
  const [formData, setFormData] = useState({
    question: step?.question || "",
    answer: step?.answer || "",
    clientResponse: step?.clientResponse || "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const { loading, setLoading } = useToastContext();

  const currentStep = STEP_CONFIG[stepKey];

  const save = async () => {
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
      setHasChanges(false);
      onSaved?.(stepKey, formData);
      return true;
    }
    return false;
  };

  useImperativeHandle(
    ref,
    () => ({
      flush: async () => (hasChanges ? save() : true),
    }),
    [hasChanges, formData, step?.id]
  );

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${theme.palette.divider}`,
        borderInlineStart: `3px solid ${color}`,
        bgcolor: "background.paper",
        p: 2.25,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
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
            bgcolor: alpha(color, 0.14),
            color,
          }}
        >
          {stepKey.toUpperCase()}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color }}>
            {currentStep.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {currentStep.description}
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        <TextField
          fullWidth
          size="small"
          label="Your response"
          placeholder="The line you'd say to the client..."
          multiline
          rows={3}
          dir="auto"
          value={formData.answer}
          onChange={(e) => handleChange("answer", e.target.value)}
        />
        <TextField
          fullWidth
          size="small"
          label="Question to ask (optional)"
          placeholder="A question that opens the conversation..."
          multiline
          rows={2}
          dir="auto"
          value={formData.question}
          onChange={(e) => handleChange("question", e.target.value)}
        />
        <TextField
          fullWidth
          size="small"
          label="Expected client response (optional)"
          placeholder="What you expect the client to say..."
          multiline
          rows={2}
          dir="auto"
          value={formData.clientResponse}
          onChange={(e) => handleChange("clientResponse", e.target.value)}
        />
      </Stack>

      {hasChanges && (
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={
              loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <MdSave />
              )
            }
            onClick={save}
            disabled={loading}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </Stack>
      )}
    </Box>
  );
});

VersaStep.displayName = "VersaStep";

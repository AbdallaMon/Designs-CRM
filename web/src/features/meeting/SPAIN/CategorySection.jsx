"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Typography,
  Box,
  TextField,
  Divider,
  CircularProgress,
  Alert,
  Collapse,
  Stack,
  alpha,
} from "@mui/material";

import { MdAdd, MdExpandMore } from "react-icons/md";

import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { QuestionItem } from "@/features/meeting/SPAIN/QuestionItem.jsx";

// Friendly display names for the SPIN category enums (never show the raw DB name).
const CATEGORY_DISPLAY_NAMES = {
  SITUATION: "Situation",
  PROBLEM: "Problem",
  IMPLICATION: "Implication",
  NEED_PAYOFF: "Need-payoff",
};

const answeredCount = (questions) =>
  questions.filter((q) => q.answer?.response?.trim()).length;

// Controlled collapsible category: a letter tile + friendly name + answered/total pill
// + chevron, then its questions. Expansion is owned by the parent dialog so only ONE
// category is open at a time (mid-meeting focus). Submitting an answer updates ONLY that
// question in local state — no category refetch, so other in-progress drafts survive.
export const CategorySection = ({
  category,
  clientLeadId,
  expanded,
  onToggle,
  onCountsChange,
}) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customQuestionTitle, setCustomQuestionTitle] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);

  const displayName = CATEGORY_DISPLAY_NAMES[category.name] || category.name;

  const fetchQuestions = useCallback(async () => {
    const response = await getData({
      url: `questions/session-questions/${clientLeadId}?questionTypeId=${category.id}&`,
      setLoading,
    });
    if (response.status === 200) {
      setQuestions(response.data);
    }
  }, [clientLeadId, category.id]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Report answered/total up to the dialog for the header progress + the category pill.
  useEffect(() => {
    onCountsChange?.(category.id, {
      answered: answeredCount(questions),
      total: questions.length,
    });
  }, [questions, category.id, onCountsChange]);

  // Save one answer. Uses a silent loader (never the category loader — that would unmount
  // the sibling questions and wipe their drafts) and patches only this question in place.
  const handleSubmitAnswer = async (sessionQuestionId, content) => {
    const request = await handleRequestSubmit(
      { response: content },
      () => {},
      `questions/${sessionQuestionId}/answer`,
      false,
      "Saving answer"
    );

    if (request.status === 200) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === sessionQuestionId ? { ...q, answer: request.data } : q
        )
      );
    }
    return request;
  };

  const handleAddCustomQuestion = async () => {
    if (!customQuestionTitle.trim()) return;

    const request = await handleRequestSubmit(
      {
        title: customQuestionTitle,
        questionTypeId: category.id,
        isCustom: true,
      },
      () => {},
      `questions/lead/${clientLeadId}/custom-question`,
      false,
      "Adding"
    );

    setCustomQuestionTitle("");
    setShowAddCustom(false);

    // Append the created question in place — no refetch, so drafts survive.
    if (request.status === 200 && request.data) {
      setQuestions((prev) => [...prev, { ...request.data, answer: null }]);
    }
  };

  const answered = answeredCount(questions);
  const total = questions.length;
  const complete = total > 0 && answered === total;

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        onClick={onToggle}
        role="button"
        aria-expanded={expanded}
        sx={{
          p: 2,
          cursor: "pointer",
          "&:hover": {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
          },
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "1.05rem",
            bgcolor: (theme) =>
              alpha(theme.palette[complete ? "success" : "primary"].main, 0.12),
            color: complete ? "success.main" : "primary.main",
          }}
        >
          {displayName[0]}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{
              color: complete ? "success.main" : "primary.main",
              fontWeight: 700,
              letterSpacing: 0.8,
              lineHeight: 1.2,
              display: "block",
            }}
          >
            {displayName}
          </Typography>
          {category.label && (
            <Typography
              variant="subtitle1"
              fontWeight={700}
              dir="auto"
              noWrap
              sx={{ lineHeight: 1.35 }}
            >
              {category.label}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 1.5,
            fontSize: "0.72rem",
            fontWeight: 700,
            color: complete ? "success.main" : "primary.main",
            bgcolor: (theme) =>
              alpha(theme.palette[complete ? "success" : "primary"].main, 0.12),
          }}
        >
          {answered}/{total}
        </Box>

        <Box
          sx={{
            display: "flex",
            transition: "transform 0.2s ease",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            color: "text.secondary",
          }}
        >
          <MdExpandMore />
        </Box>
      </Stack>

      <Collapse in={expanded} unmountOnExit>
        <Divider />
        <Box sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <>
              {questions.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                  No questions found for this category. Add a custom question to
                  get started!
                </Alert>
              ) : (
                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  {questions.map((question) => (
                    <QuestionItem
                      key={question.id}
                      sessionQuestion={question}
                      onSubmitAnswer={handleSubmitAnswer}
                    />
                  ))}
                </Stack>
              )}

              {/* Add Custom Question */}
              {!showAddCustom ? (
                <Button
                  startIcon={<MdAdd />}
                  onClick={() => setShowAddCustom(true)}
                  variant="outlined"
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Add Custom Question
                </Button>
              ) : (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  alignItems={{ xs: "stretch", sm: "flex-start" }}
                >
                  <TextField
                    fullWidth
                    label="Custom Question Title"
                    value={customQuestionTitle}
                    onChange={(e) => setCustomQuestionTitle(e.target.value)}
                    size="small"
                    dir="auto"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddCustomQuestion();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddCustomQuestion}
                    disabled={!customQuestionTitle.trim()}
                    variant="contained"
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Add
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddCustom(false);
                      setCustomQuestionTitle("");
                    }}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Cancel
                  </Button>
                </Stack>
              )}
            </>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

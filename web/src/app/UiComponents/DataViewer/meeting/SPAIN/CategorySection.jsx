"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  IconButton,
  Typography,
  Box,
  TextField,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Collapse,
  Fade,
  Slide,
  Badge,
  alpha,
} from "@mui/material";

import {
  MdAdd,
  MdCategory,
  MdExpandMore,
  MdTrendingUp,
} from "react-icons/md";

import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { QuestionItem } from "./QuestionItem";

// Modern Category Section with Advanced Animations
export const CategorySection = ({ category, clientLeadId }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [customQuestionTitle, setCustomQuestionTitle] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch questions for this category
  const fetchQuestions = useCallback(async () => {
    const response = await getData({
      url: `shared/questions/session-questions/${clientLeadId}?questionTypeId=${category.id}&`,
      setLoading,
    });
    if (response.status === 200) {
      setQuestions(response.data);
      return response.data;
    }
  }, [clientLeadId, category.id]);

  async function onSubmitAnswer() {
    return await fetchQuestions();
  }

  async function onAddCustomQuestion() {
    return await fetchQuestions();
  }

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSubmitAnswer = async (sessionQuestionId, content) => {
    const request = await handleRequestSubmit(
      { sessionQuestionId, response: content },
      setLoading,
      `shared/questions/${sessionQuestionId}/answer`,
      false,
      "Submitting"
    );

    if (request.status === 200) {
      onSubmitAnswer(sessionQuestionId, content);
    }
  };

  const handleAddCustomQuestion = async () => {
    if (!customQuestionTitle.trim()) {
      return;
    }

    const request = await handleRequestSubmit(
      {
        title: customQuestionTitle,
        questionTypeId: category.id,
        isCustom: true,
      },
      setLoading,
      `shared/questions/lead/${clientLeadId}/custom-question`,
      false,
      "Adding"
    );

    setCustomQuestionTitle("");
    setShowAddCustom(false);

    if (request.status === 200) {
      onAddCustomQuestion(category.id);
    }
  };
  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: 5,
        overflow: "hidden",
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(
            theme.palette.background.paper,
            0.9
          )} 0%, ${alpha(theme.palette.background.default, 0.6)} 100%)`,
        backdropFilter: "blur(20px)",
        border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: (theme) =>
          isHovered
            ? `0 16px 48px ${alpha(theme.palette.common.black, 0.08)}`
            : `0 8px 32px ${alpha(theme.palette.common.black, 0.04)}`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent sx={{ p: 0 }}>
        <Box
          sx={{
            p: 3,
            background: (theme) =>
              `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.1
              )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.15
                )} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
            },
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: (theme) =>
                  `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <MdCategory size={24} />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 0.5,
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {category.name[0]} - {category.name} {category.label}
              </Typography>
            </Box>

            <Badge
              badgeContent={questions.length}
              color="primary"
              sx={{
                "& .MuiBadge-badge": {
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  minWidth: 24,
                  height: 24,
                },
              }}
            >
              <Chip
                label={`${questions.length} questions`}
                size="medium"
                variant="outlined"
                icon={<MdTrendingUp />}
                sx={{
                  fontWeight: 600,
                  borderRadius: 2,
                  mr: 2,
                }}
              />
            </Badge>

            <IconButton
              sx={{
                transition: "transform 0.3s ease",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <MdExpandMore />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Collapse in={expanded} timeout={400}>
          <Box sx={{ p: 3 }}>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 6,
                }}
              >
                <CircularProgress size={48} thickness={4} />
              </Box>
            ) : (
              <>
                {questions.length === 0 ? (
                  <Alert
                    severity="info"
                    sx={{
                      mb: 3,
                      borderRadius: 3,
                      background: (theme) =>
                        `linear-gradient(135deg, ${alpha(
                          theme.palette.info.main,
                          0.1
                        )} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
                    }}
                  >
                    No questions found for this category. Add a custom question
                    to get started!
                  </Alert>
                ) : (
                  <Box sx={{ mb: 3 }}>
                    {questions.map((question, index) => (
                      <Slide
                        key={question.id}
                        direction="up"
                        in={true}
                        timeout={300 + index * 100}
                      >
                        <div>
                          <QuestionItem
                            sessionQuestion={question}
                            onSubmitAnswer={handleSubmitAnswer}
                          />
                        </div>
                      </Slide>
                    ))}
                  </Box>
                )}

                <Divider
                  sx={{
                    my: 3,
                    background: (theme) =>
                      `linear-gradient(90deg, transparent 0%, ${alpha(
                        theme.palette.divider,
                        0.3
                      )} 50%, transparent 100%)`,
                  }}
                />

                {/* Add Custom Question Section */}
                <Box>
                  {!showAddCustom ? (
                    <Button
                      startIcon={<MdAdd />}
                      onClick={() => setShowAddCustom(true)}
                      variant="outlined"
                      size="large"
                      sx={{
                        borderRadius: 3,
                        textTransform: "none",
                        fontWeight: 600,
                        px: 3,
                        py: 1.5,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: (theme) =>
                            `0 8px 24px ${alpha(
                              theme.palette.primary.main,
                              0.2
                            )}`,
                        },
                      }}
                    >
                      Add Custom Question
                    </Button>
                  ) : (
                    <Fade in={showAddCustom}>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          alignItems: "flex-end",
                          p: 3,
                          borderRadius: 3,
                          background: (theme) =>
                            `linear-gradient(135deg, ${alpha(
                              theme.palette.primary.main,
                              0.05
                            )} 0%, ${alpha(
                              theme.palette.secondary.main,
                              0.02
                            )} 100%)`,
                          border: (theme) =>
                            `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        }}
                      >
                        <TextField
                          fullWidth
                          label="Custom Question Title"
                          value={customQuestionTitle}
                          onChange={(e) =>
                            setCustomQuestionTitle(e.target.value)
                          }
                          size="medium"
                          variant="outlined"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                            },
                          }}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleAddCustomQuestion();
                            }
                          }}
                        />
                        <Button
                          onClick={handleAddCustomQuestion}
                          disabled={!customQuestionTitle.trim()}
                          variant="contained"
                          size="large"
                          sx={{
                            minWidth: 100,
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          Add
                        </Button>
                        <Button
                          onClick={() => {
                            setShowAddCustom(false);
                            setCustomQuestionTitle("");
                          }}
                          size="large"
                          sx={{
                            minWidth: 100,
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Fade>
                  )}
                </Box>
              </>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

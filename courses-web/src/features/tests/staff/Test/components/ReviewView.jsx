"use client";
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
} from "@mui/material";
import { FaArrowLeft } from "react-icons/fa";
import { QuestionTypesLabels } from "@/app/helpers/constants";
import { formatNumber } from "../helpers";
import RenderQuestionContent from "./RenderQuestionContent";

const ReviewView = ({
  selectedAttemptForReview,
  questions,
  userAnswers,
  attempts,
  test,
  onBack,
}) => {
  if (!selectedAttemptForReview) return null;

  const reviewAnswers = {};
  selectedAttemptForReview.answers.forEach((answer) => {
    reviewAnswers[answer.questionId] = {
      selectedAnswers: answer.selectedAnswers.map((sa) => sa.value),
      textAnswer: answer.textAnswer,
    };
  });

  return (
    <Box sx={{ direction: "rtl" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Button startIcon={<FaArrowLeft />} onClick={onBack}>
          Back to attempts
        </Button>
        <Typography variant="h5">
          Review attempt{" "}
          {formatNumber(selectedAttemptForReview.attemptCount)}
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Score: {formatNumber(selectedAttemptForReview.score)}% | Status:{" "}
        {selectedAttemptForReview.passed ? "Passed" : "Failed"}
      </Alert>

      {questions.map((question, index) => (
        <Card key={question.id} sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
            >
              <Typography variant="h6">
                Question {formatNumber(index + 1)}
              </Typography>
              <Chip
                label={QuestionTypesLabels[question.type]}
                size="small"
                variant="outlined"
              />
            </Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {question.question}
            </Typography>
            <RenderQuestionContent
              question={question}
              isReview={true}
              reviewAnswers={reviewAnswers}
              userAnswers={userAnswers}
              attempts={attempts}
              test={test}
            />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ReviewView;

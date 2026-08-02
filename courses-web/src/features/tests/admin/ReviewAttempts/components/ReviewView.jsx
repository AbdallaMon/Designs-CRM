import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
} from "@mui/material";
import { FaArrowLeft } from "react-icons/fa";
import RenderQuestionContent from "./RenderQuestionContent";
import { getQuestionTypeInArabic } from "../helpers";

const ReviewView = ({
  selectedAttempt,
  questions,
  attempts,
  test,
  onApprovalChange,
  approvalLoading,
  onBack,
}) => {
  if (!selectedAttempt) return null;

  const reviewAnswers = {};
  selectedAttempt.answers.forEach((answer) => {
    reviewAnswers[answer.questionId] = {
      selectedAnswers: answer.selectedAnswers.map((sa) => sa.value),
      textAnswer: answer.textAnswer,
      isApproved: answer.isApproved,
    };
  });

  return (
    <Box dir="rtl">
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
          Review attempt {selectedAttempt.attemptCount}
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Score: {selectedAttempt.score}% | Status:{" "}
        {selectedAttempt.passed ? "Passed" : "Failed"} | Time spent:{" "}
        {selectedAttempt.timePassed} minutes
      </Alert>

      {questions.map((question, index) => (
        <Card key={question.id} sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
            >
              <Typography variant="h6">Question {index + 1}</Typography>
              <Chip
                label={getQuestionTypeInArabic(question.type)}
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
              attempts={attempts}
              test={test}
              selectedAttempt={selectedAttempt}
              onApprovalChange={onApprovalChange}
              approvalLoading={approvalLoading}
            />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ReviewView;

"use client";
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import {
  FaClock,
  FaCheck,
  FaArrowLeft,
  FaQuestionCircle,
} from "react-icons/fa";
import { QuestionTypesLabels } from "@/app/helpers/constants";
import { formatTime, toArabicNumerals } from "../helpers";
import RenderQuestionContent from "./RenderQuestionContent";

const AllQuestionsView = ({
  questions,
  test,
  timeLeft,
  savingAnswers,
  errorQuestions,
  userAnswers,
  attempts,
  onBack,
  handleAnswerChange,
  handleSubmitAttempt,
}) => {
  if (!questions.length) return null;

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
          العودة إلى المحاولات
        </Button>
        {test?.timeLimit && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaClock />
            <Typography
              variant="h6"
              color={timeLeft < 300 ? "error" : "inherit"}
            >
              {formatTime(timeLeft)}
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          أجب عن جميع الأسئلة أدناه واضغط حفظ عند الانتهاء
        </Typography>
        <LinearProgress variant="determinate" value={100} />
      </Box>

      {questions.map((question, index) => {
        const isSavingThisQuestion = savingAnswers?.includes(question.id);
        const isError = errorQuestions.includes(question.id);

        return (
          <Card
            key={question.id}
            id={`question-${question.id}`}
            sx={{
              position: "relative",
              mb: 3,

              border: isError
                ? "2px solid"
                : isSavingThisQuestion
                ? "2px solid"
                : "1px solid",
              borderColor: isError
                ? "error.main"
                : isSavingThisQuestion
                ? "primary.main"
                : "divider",
              animation: isSavingThisQuestion
                ? "pulse 1.5s infinite"
                : "none",
              "@keyframes pulse": {
                "0%": { borderColor: "primary.main" },
                "50%": { borderColor: "primary.light" },
                "100%": { borderColor: "primary.main" },
              },
            }}
          >
            {isSavingThisQuestion && (
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  zIndex: 1,
                }}
              >
                <CircularProgress size={20} />
              </Box>
            )}
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <FaQuestionCircle />
                <Typography variant="h6">
                  السؤال رقم {toArabicNumerals(index + 1)}
                </Typography>{" "}
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
                handleAnswerChange={handleAnswerChange}
                userAnswers={userAnswers}
                savingAnswers={savingAnswers}
                attempts={attempts}
                test={test}
              />{" "}
            </CardContent>
          </Card>
        );
      })}

      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Button
          variant="contained"
          color="success"
          size="large"
          endIcon={<FaCheck />}
          disabled={savingAnswers?.length > 0}
          onClick={() => handleSubmitAttempt()}
        >
          احفظ الاختبار
        </Button>
      </Box>
    </Box>
  );
};

export default AllQuestionsView;

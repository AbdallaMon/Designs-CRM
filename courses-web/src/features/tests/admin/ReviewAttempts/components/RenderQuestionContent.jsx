import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Checkbox,
  FormGroup,
  Paper,
  Typography,
  CircularProgress,
  debounce,
} from "@mui/material";
import { FaCheck, FaTimes, FaThumbsUp } from "react-icons/fa";
import { COURSE_QUESTION_TYPES } from "@dms/shared";

const RenderQuestionContent = ({
  question,
  isReview = false,
  reviewAnswers = null,
  handleAnswerChange,
  userAnswers,
  attempts,
  test,
  selectedAttempt,
  onApprovalChange,
  approvalLoading,
}) => {
  const currentAnswer = isReview
    ? reviewAnswers?.[question.id]
    : userAnswers[question.id];

  const handleChange = (answer) => {
    if (!isReview) {
      handleAnswerChange(question.id, answer);
    }
  };

  const orderedChoices = [];
    if (question.type === COURSE_QUESTION_TYPES.ORDERING) {
    currentAnswer.selectedAnswers.forEach((answerText) => {
      const choice = question.choices.find((c) => c.text === answerText);
      if (choice) {
        orderedChoices.push(choice);
      }
    });

    question.choices.forEach((choice) => {
      if (!orderedChoices.find((oc) => oc.id === choice.id)) {
        orderedChoices.push(choice);
      }
    });
  }

  const [localText, setLocalText] = useState(currentAnswer?.textAnswer || "");
  const debouncedSave = useMemo(
    () =>
      debounce((value) => {
        if (!isReview) {
          handleAnswerChange(question.id, { textAnswer: value });
        }
      }, 500),
    [handleAnswerChange, isReview, question.id]
  );

  useEffect(() => () => debouncedSave.clear(), [debouncedSave]);

  const handleLocalChange = (e) => {
    setLocalText(e.target.value);
    debouncedSave(e.target.value);
  };

  const approvalKey = `${selectedAttempt?.id}_${question.id}`;
  const isApprovalLoading = approvalLoading[approvalKey];

  switch (question.type) {
    case COURSE_QUESTION_TYPES.MULTIPLE_CHOICE:
      return (
        <FormControl
          component="fieldset"
          fullWidth
          disabled={isReview}
          dir="rtl"
        >
          <FormLabel component="legend">Select all correct answers:</FormLabel>
          <FormGroup>
            {question.choices.map((choice) => (
              <FormControlLabel
                key={choice.id}
                control={
                  <Checkbox
                    checked={
                      currentAnswer?.selectedAnswers?.includes(choice.text) ||
                      false
                    }
                    onChange={(e) => {
                      const current = currentAnswer?.selectedAnswers || [];
                      const newSelected = e.target.checked
                        ? [...current, choice.text]
                        : current.filter((v) => v !== choice.text);
                      handleChange({ selectedAnswers: newSelected });
                    }}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {choice.text}
                    <>
                      {isReview && choice.isCorrect && (
                        <FaCheck color="green" />
                      )}
                      {isReview &&
                        !choice.isCorrect &&
                        currentAnswer?.selectedAnswers?.includes(
                          choice.text
                        ) && <FaTimes color="red" />}
                    </>
                  </Box>
                }
              />
            ))}
          </FormGroup>
        </FormControl>
      );

    case COURSE_QUESTION_TYPES.SINGLE_CHOICE:
      return (
        <FormControl
          component="fieldset"
          fullWidth
          disabled={isReview}
          dir="rtl"
        >
          <FormLabel component="legend">Select one answer:</FormLabel>
          <RadioGroup
            value={currentAnswer?.selectedAnswers?.[0] || ""}
            onChange={(e) =>
              handleChange({ selectedAnswers: [e.target.value] })
            }
          >
            {question.choices.map((choice) => (
              <FormControlLabel
                key={choice.id}
                value={choice.text}
                control={<Radio />}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {choice.text}
                    <>
                      {isReview && choice.isCorrect && (
                        <FaCheck color="green" />
                      )}
                      {isReview &&
                        !choice.isCorrect &&
                        currentAnswer?.selectedAnswers?.includes(
                          choice.text
                        ) && <FaTimes color="red" />}
                    </>
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>
      );

    case COURSE_QUESTION_TYPES.TRUE_FALSE:
      return (
        <FormControl
          component="fieldset"
          fullWidth
          disabled={isReview}
          dir="rtl"
        >
          <FormLabel component="legend">True or false:</FormLabel>
          <RadioGroup
            value={currentAnswer?.selectedAnswers?.[0] || ""}
            onChange={(e) =>
              handleChange({ selectedAnswers: [e.target.value] })
            }
          >
            {question.choices.map((choice) => (
              <FormControlLabel
                key={choice.id}
                value={choice.text}
                control={<Radio />}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {choice.text === "True"
                      ? "True"
                      : choice.text === "False"
                      ? "False"
                      : choice.text}
                    <>
                      {isReview && choice.isCorrect && (
                        <FaCheck color="green" />
                      )}
                      {isReview &&
                        !choice.isCorrect &&
                        currentAnswer?.selectedAnswers?.includes(
                          choice.text
                        ) && <FaTimes color="red" />}
                    </>
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>
      );

    case COURSE_QUESTION_TYPES.TEXT:
      return (
        <Box dir="rtl">
          {isReview && currentAnswer?.textAnswer && (
            <Box sx={{ my: 2, display: "flex", gap: 2, alignItems: "center" }}>
              {!currentAnswer.isApproved && (
                <Button
                  variant={
                    currentAnswer.isApproved === true ? "contained" : "outlined"
                  }
                  color="success"
                  size="small"
                  startIcon={<FaThumbsUp />}
                  onClick={() =>
                    onApprovalChange(selectedAttempt.id, question.id, true)
                  }
                  disabled={isApprovalLoading}
                >
                  {isApprovalLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    "Accept this answer?"
                  )}
                </Button>
              )}
              {currentAnswer.isApproved && (
                <Button
                  variant={
                    currentAnswer.isApproved === false
                      ? "contained"
                      : "outlined"
                  }
                  color="error"
                  size="small"
                  startIcon={<FaTimes />}
                  onClick={() =>
                    onApprovalChange(selectedAttempt.id, question.id, false)
                  }
                  disabled={isApprovalLoading}
                >
                  {isApprovalLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    "Reject this question"
                  )}
                </Button>
              )}
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            value={localText}
            onChange={handleLocalChange}
            onBlur={() => handleChange({ textAnswer: localText })}
            placeholder="Enter your answer here..."
            disabled={isReview}
            dir="rtl"
          />
        </Box>
      );

    case COURSE_QUESTION_TYPES.ORDERING:
      return (
        <FormControl
          component="fieldset"
          fullWidth
          disabled={isReview}
          dir="rtl"
        >
          <Box sx={{ mt: 2 }}>
            {orderedChoices?.map((choice, index) => (
              <Paper
                key={choice.id}
                elevation={1}
                sx={{
                  p: 2,
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "background.paper",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      minWidth: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "primary.main",
                      color: "primary.contrastText",
                      borderRadius: "50%",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                    }}
                  >
                    {index + 1}
                  </Typography>
                  <Typography variant="body1">{choice.text}</Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        minWidth: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "success.main",
                        color: "success.contrastText",
                        borderRadius: "50%",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      {choice.order}
                    </Typography>
                    {index + 1 === (choice.order || 0) ? (
                      <FaCheck color="green" />
                    ) : (
                      <FaTimes color="red" />
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </FormControl>
      );

    default:
      return null;
  }
};

export default RenderQuestionContent;

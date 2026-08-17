"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
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
  IconButton,
  debounce,
} from "@mui/material";
import { FaCheck, FaTimes } from "react-icons/fa";
import { MdArrowDownward, MdArrowUpward } from "react-icons/md";
import { COURSE_QUESTION_TYPES } from "@dms/shared";

function choiceSortKey(choice, questionId) {
  const value = `${questionId}:${choice.id}:${choice.text}`;
  return [...value].reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    0
  );
}

const RenderQuestionContent = ({
  question,
  isReview = false,
  reviewAnswers = null,
  handleAnswerChange,
  userAnswers,
  attempts,
}) => {
  const currentAnswer = isReview
    ? reviewAnswers?.[question.id]
    : userAnswers[question.id];
  const handleChange = (answer) => {
    if (!isReview) {
      handleAnswerChange(question.id, answer);
    }
  };

  const initialOrderedChoices = useMemo(
    () =>
      [...question.choices].sort(
        (a, b) =>
          choiceSortKey(a, question.id) - choiceSortKey(b, question.id)
      ),
    [question.choices, question.id]
  );

  const orderedChoices = (() => {
    if (currentAnswer?.selectedAnswers?.length > 0) {
      const orderedChoices = [];
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

      return orderedChoices;
    }
    if (isReview) {
      return [...question.choices].sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );
    }
    return initialOrderedChoices;
  })();

  useEffect(() => {
    if (
      question.type === COURSE_QUESTION_TYPES.ORDERING &&
      !isReview &&
      !currentAnswer?.selectedAnswers?.length
    ) {
      handleAnswerChange(question.id, {
        selectedAnswers: initialOrderedChoices.map((choice) => choice.text),
      });
    }
  }, [
    currentAnswer?.selectedAnswers?.length,
    handleAnswerChange,
    initialOrderedChoices,
    isReview,
    question.id,
    question.type,
  ]);

  const moveChoice = (currentIndex, direction) => {
    const newChoices = [...orderedChoices];
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= newChoices.length) return;

    // Swap the choices
    [newChoices[currentIndex], newChoices[targetIndex]] = [
      newChoices[targetIndex],
      newChoices[currentIndex],
    ];

    // Save the new order
    handleChange({ selectedAnswers: newChoices.map((c) => c.text) });
  };

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

  switch (question.type) {
    case COURSE_QUESTION_TYPES.MULTIPLE_CHOICE:
      return (
        <FormControl component="fieldset" fullWidth disabled={isReview}>
          <FormLabel component="legend">Select all that apply:</FormLabel>
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
                    {attempts && attempts.find((attempt) => attempt.passed) && (
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
                    )}
                  </Box>
                }
              />
            ))}
          </FormGroup>
        </FormControl>
      );

    case COURSE_QUESTION_TYPES.SINGLE_CHOICE:
      return (
        <FormControl component="fieldset" fullWidth disabled={isReview}>
          <FormLabel component="legend">Select one:</FormLabel>
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
                    {attempts && attempts.find((attempt) => attempt.passed) && (
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
                    )}
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>
      );

    case COURSE_QUESTION_TYPES.TRUE_FALSE:
      return (
        <FormControl component="fieldset" fullWidth disabled={isReview}>
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
                    {choice.text === "True" ? "True" : "False"}
                    {attempts && attempts.find((attempt) => attempt.passed) && (
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
                    )}
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>
      );

    case COURSE_QUESTION_TYPES.TEXT:
      return (
        <TextField
          fullWidth
          multiline
          rows={4}
          value={localText}
          onChange={handleLocalChange}
          placeholder="Enter your answer here..."
          disabled={isReview}
        />
      );

    case COURSE_QUESTION_TYPES.ORDERING:
      return (
        <FormControl component="fieldset" fullWidth disabled={isReview}>
          <FormLabel component="legend">
            Use the arrows to reorder the answers.
          </FormLabel>
          <Box sx={{ mt: 2 }}>
            {orderedChoices.map((choice, index) => (
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
                  {attempts &&
                  attempts.find((attempt) => attempt.passed) &&
                  isReview ? (
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
                  ) : (
                    // Show move buttons in active mode
                    !isReview && (
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <IconButton
                          onClick={() => moveChoice(index, "up")}
                          disabled={index === 0}
                          sx={{ p: 1, mb: 1 }}
                          size="large"
                        >
                          <MdArrowUpward size={16} />
                        </IconButton>
                        <IconButton
                          onClick={() => moveChoice(index, "down")}
                          disabled={index === orderedChoices.length - 1}
                          sx={{ p: 1, mb: 1 }}
                          size="large"
                        >
                          <MdArrowDownward size={16} />
                        </IconButton>
                      </Box>
                    )
                  )}
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

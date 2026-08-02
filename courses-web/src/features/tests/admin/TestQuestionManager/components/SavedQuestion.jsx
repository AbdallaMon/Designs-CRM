"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  MdAdd as AddIcon,
  MdSave as SaveIcon,
  MdEdit as EditIcon,
  MdDelete as DeleteIcon,
  MdCancel as CancelIcon,
  MdExpandMore as ExpandMoreIcon,
  MdArrowUpward as ArrowUpIcon,
  MdArrowDownward as ArrowDownIcon,
} from "react-icons/md";
import { QuestionTypes } from "@/app/helpers/constants";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import LoadingOverlay from "@/shared/components/feedback/loaders/LoadingOverlay";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import ChoiceEditor from "./ChoiceEditor";

const SavedQuestion = React.memo(
  ({ questionId, testId, questions, index, moveQuestion, setDeleteDialog }) => {
    const [question, setQuestion] = useState({});
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState({
      type: "",
      question: "",
      choices: [],
    });
    const { setAlertError } = useAlertContext();
    const { setToastLoading } = useToastContext();

    const getQuestion = useCallback(async () => {
      await getDataAndSet({
        url: `courses/tests/${testId}/test-questions/${questionId}`,
        setLoading,
        setData: setQuestion,
      });
    }, [testId, questionId]);

    useEffect(() => {
      getQuestion();
    }, [getQuestion]);

    const moveChoice = useCallback((choiceId, direction) => {
      setEditedQuestion((prev) => {
        const choices = [...prev.choices];
        const index = choices.findIndex((c) => c.id === choiceId);
        if (index === -1) return prev;

        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= choices.length) return prev;

        [choices[index], choices[targetIndex]] = [
          choices[targetIndex],
          choices[index],
        ];

        const updatedChoices = choices.map((c, idx) => ({
          ...c,
          order: idx + 1,
        }));

        return {
          ...prev,
          choices: updatedChoices,
        };
      });
    }, []);

    const createEmptyChoice = useCallback(
      (withOrder, order) => ({
        id: Date.now() + Math.random(),
        text: "",
        value: "",
        isCorrect: false,
        type: "CREATE",
        ...(withOrder ? { order } : {}),
      }),
      []
    );

    const startEdit = useCallback(() => {
      setEditedQuestion({
        type: question.type,
        question: question.question,
        choices:
          question.choices?.map((choice) => ({
            ...choice,
            id: choice.id || Date.now() + Math.random(),
          })) || [],
      });
      setIsEditing(true);
    }, [question]);

    const cancelEdit = useCallback(() => {
      setIsEditing(false);
      setEditedQuestion({ type: "", question: "", choices: [] });
    }, []);

    const addChoice = useCallback(
      (withOrder, order) => {
        setEditedQuestion((prev) => ({
          ...prev,
          choices: [...prev.choices, createEmptyChoice(withOrder, order)],
        }));
      },
      [createEmptyChoice]
    );

    const updateChoice = useCallback((choiceId, field, value) => {
      setEditedQuestion((prev) => ({
        ...prev,
        choices: prev.choices.map((choice) =>
          choice.id === choiceId
            ? { ...choice, [field]: value }
            : (field === "isCorrect" &&
                prev.type === QuestionTypes.SINGLE_CHOICE) ||
              (field === "isCorrect" && prev.type === QuestionTypes.TRUE_FALSE)
            ? { ...choice, isCorrect: false }
            : choice
        ),
      }));
    }, []);

    const removeChoice = useCallback((choiceId) => {
      setEditedQuestion((prev) => {
        return {
          ...prev,
          choices: prev.choices.map((choice) => {
            if (choice.id === choiceId) {
              choice.type = "DELETE";
            }
            return choice;
          }),
        };
      });
    }, []);

    const validateQuestion = useCallback((question) => {
      if (!question.question.trim()) return "Question text is required";
      if (!question.type) return "Question type is required";

      if (question.type !== QuestionTypes.TEXT) {
        if (question.choices.length < 2)
          return "At least 2 choices are required";
        if (question.choices.some((c) => !c.text.trim() && c.type !== "DELETE"))
          return "All choices must have text";
        if (
          !question.choices.some(
            (c) => (c.isCorrect && c.type !== "DELETE") || c.order
          )
        )
          return "At least one correct answer is required";
      }

      return null;
    }, []);

    const saveEdit = useCallback(async () => {
      const validation = validateQuestion(editedQuestion);
      if (validation) {
        setAlertError(validation);
        return;
      }

      const req = await handleRequestSubmit(
        editedQuestion,
        setToastLoading,
        `courses/tests/${testId}/test-questions/${questionId}`,
        false,
        "Updating",
        false,
        "PUT"
      );

      if (req.status === 200) {
        setIsEditing(false);
        await getQuestion();
      }
    }, [
      editedQuestion,
      validateQuestion,
      setAlertError,
      setToastLoading,
      testId,
      questionId,
      getQuestion,
    ]);

    const updateQuestionText = useCallback((value) => {
      setEditedQuestion((prev) => ({ ...prev, question: value }));
    }, []);

    const handleMoveUp = useCallback(() => {
      moveQuestion(question?.id, "up");
    }, [moveQuestion, question?.id]);

    const handleMoveDown = useCallback(() => {
      moveQuestion(question?.id, "down");
    }, [moveQuestion, question?.id]);

    const handleDelete = useCallback(() => {
      setDeleteDialog({ open: true, questionId: question?.id });
    }, [setDeleteDialog, question?.id]);

    const renderChoicesEditor = useMemo(() => {
      if (editedQuestion.type === QuestionTypes.TEXT) return null;

      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Answer Choices
          </Typography>

          {editedQuestion.choices.map((choice, index) => {
            if (choice.type === "DELETE") return null;
            return (
              <ChoiceEditor
                key={choice.id}
                choice={choice}
                index={index}
                questionType={editedQuestion.type}
                onUpdate={updateChoice}
                onRemove={removeChoice}
                onMove={moveChoice}
                canRemove={editedQuestion.choices.length > 2}
              />
            );
          })}

          {editedQuestion.type !== QuestionTypes.TRUE_FALSE && (
            <Button
              startIcon={<AddIcon />}
              onClick={() => {
                addChoice(
                  editedQuestion.type === QuestionTypes.ORDERING,
                  editedQuestion.choices.length
                );
              }}
              variant="outlined"
              sx={{ mt: 1 }}
            >
              Add Choice
            </Button>
          )}
        </Box>
      );
    }, [
      editedQuestion.type,
      editedQuestion.choices,
      updateChoice,
      removeChoice,
      moveChoice,
      addChoice,
    ]);

    return (
      <Accordion key={questionId} sx={{ mb: 2, position: "relative" }}>
        {loading && <LoadingOverlay />}
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
            <Typography variant="h6">Question {index + 1} </Typography>
            <Chip
              label={question?.type?.replace("_", " ")}
              size="small"
              variant="outlined"
            />
            <Typography variant="body2" sx={{ flex: 1, mr: 2 }}>
              {question?.question?.substring(0, 100)}...
            </Typography>
          </Box>
        </AccordionSummary>

        <AccordionDetails>
          {!isEditing ? (
            <>
              <Typography variant="body1" gutterBottom>
                {question?.question}
              </Typography>

              {question?.type !== QuestionTypes.TEXT && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Answer Choices:
                  </Typography>
                  {question?.choices?.map((choice, idx) => (
                    <Box
                      key={choice.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        {idx + 1}. {choice.text}
                      </Typography>
                      {choice.isCorrect && (
                        <Chip label="Correct" size="small" color="success" />
                      )}
                    </Box>
                  ))}
                </Box>
              )}

              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <IconButton
                  onClick={handleMoveUp}
                  disabled={index === 0}
                  size="small"
                >
                  <ArrowUpIcon />
                </IconButton>
                <IconButton
                  onClick={handleMoveDown}
                  disabled={index === questions.length - 1}
                  size="small"
                >
                  <ArrowDownIcon />
                </IconButton>
                <IconButton onClick={startEdit} size="small" color="primary">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={handleDelete} size="small" color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </>
          ) : (
            <>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Question"
                value={editedQuestion.question}
                onChange={(e) => updateQuestionText(e.target.value)}
                margin="normal"
                placeholder="Enter your question here..."
              />

              {renderChoicesEditor}

              <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={saveEdit}
                  disabled={loading || !editedQuestion.question.trim()}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
              </Box>
            </>
          )}
        </AccordionDetails>
      </Accordion>
    );
  }
);

export default SavedQuestion;

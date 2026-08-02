"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
} from "@mui/material";
import {
  MdAdd as AddIcon,
  MdSave as SaveIcon,
  MdCancel as CancelIcon,
} from "react-icons/md";
import { QuestionTypes } from "@/app/helpers/constants";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import ChoiceEditor from "./components/ChoiceEditor";
import SavedQuestion from "./components/SavedQuestion";

const TestQuestionManager = ({ testId }) => {
  const [questions, setQuestions] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    type: "",
    question: "",
    choices: [],
  });
  const [reOrder, setReorder] = useState(false);

  const { setAlertError } = useAlertContext();
  const { toastLoading, setToastLoading } = useToastContext();
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    questionId: null,
  });
  const [loading, setLoading] = useState(false);

  // Memoize the getQuestions function to prevent unnecessary re-renders
  const getQuestions = useCallback(async () => {
    await getDataAndSet({
      url: `courses/tests/${testId}`,
      setLoading,
      setData: setQuestions,
    });
  }, [testId]);

  useEffect(() => {
    getQuestions();
  }, [getQuestions]);

  // Memoize createEmptyChoice to prevent recreation on every render
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

  const handleTypeChange = useCallback(
    (type) => {
      let choices = [];

      if (
        type === QuestionTypes.MULTIPLE_CHOICE ||
        type === QuestionTypes.SINGLE_CHOICE
      ) {
        choices = [createEmptyChoice(), createEmptyChoice()];
      } else if (type === QuestionTypes.TRUE_FALSE) {
        choices = [
          { id: 1, text: "True", value: "true", isCorrect: false },
          { id: 2, text: "False", value: "false", isCorrect: false },
        ];
      } else if (type === QuestionTypes.ORDERING) {
        choices = [createEmptyChoice(true, 0), createEmptyChoice(true, 1)];
      }

      setNewQuestion({
        type,
        question: "",
        choices,
      });
    },
    [createEmptyChoice]
  );

  // Optimize addChoice with useCallback
  const addChoice = useCallback(
    (isOrdering, order) => {
      setNewQuestion((prev) => ({
        ...prev,
        choices: [...prev.choices, createEmptyChoice(isOrdering, order)],
      }));
    },
    [createEmptyChoice]
  );

  // Optimize updateChoice with useCallback
  const updateChoice = useCallback((choiceId, field, value) => {
    setNewQuestion((prev) => ({
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

  // Optimize moveChoice with useCallback
  const moveChoice = useCallback((choiceId, direction) => {
    setNewQuestion((prev) => {
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

  // Optimize removeChoice with useCallback
  const removeChoice = useCallback((choiceId) => {
    setNewQuestion((prev) => {
      return {
        ...prev,
        choices: prev.choices.filter((choice) => choice.id !== choiceId),
      };
    });
  }, []);

  // Optimize validateQuestion with useCallback
  const validateQuestion = useCallback((question) => {
    if (!question.question.trim()) return "Question text is required";
    if (!question.type) return "Question type is required";
    if (question.type !== QuestionTypes.TEXT) {
      if (question.choices.length < 2) return "At least 2 choices are required";
      if (question.choices.some((c) => !c.text.trim()))
        return "All choices must have text";
      console.log(question.choices, "choices");
      if (!question.choices.some((c) => c.isCorrect || c.order))
        return "At least one correct answer is required";
    }

    return null;
  }, []);

  const saveQuestion = useCallback(async () => {
    const validation = validateQuestion(newQuestion);
    if (validation) {
      setAlertError(validation);
      return;
    }

    const req = await handleRequestSubmit(
      newQuestion,
      setToastLoading,
      `courses/tests/${testId}/test-questions`,
      false,
      "Creating",
      false,
      "POST"
    );
    if (req.status === 200) {
      setNewQuestion({ type: "", question: "", choices: [] });
      setIsCreating(false);
      await getQuestions();
    }
  }, [
    newQuestion,
    validateQuestion,
    setAlertError,
    setToastLoading,
    testId,
    getQuestions,
  ]);

  // Delete question
  const deleteQuestion = useCallback(
    async (questionId) => {
      const req = await handleRequestSubmit(
        {},
        setToastLoading,
        `courses/tests/${testId}/test-questions/${questionId}`,
        false,
        "Deleting",
        false,
        "DELETE"
      );
      if (req.status === 200) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        setDeleteDialog({ open: false, questionId: null });
      }
    },
    [setToastLoading, testId]
  );

  // Move question up/down
  const moveQuestion = useCallback(
    async (questionId, direction) => {
      const currentIndex = questions.findIndex((q) => q.id === questionId);
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= questions.length) return questions;

      const newQuestions = [...questions];
      [newQuestions[currentIndex], newQuestions[newIndex]] = [
        newQuestions[newIndex],
        newQuestions[currentIndex],
      ];
      setReorder(true);
      setQuestions(newQuestions);
    },
    [questions]
  );

  const saveReOrdering = useCallback(async () => {
    const req = await handleRequestSubmit(
      questions,
      setToastLoading,
      `courses/tests/${testId}/test-questions/re-order`,
      false,
      "Saving"
    );
    if (req.status === 200) {
      setReorder(false);
    }
  }, [questions, setToastLoading, testId]);

  // Optimize question text update
  const updateQuestionText = useCallback((value) => {
    setNewQuestion((prev) => ({ ...prev, question: value }));
  }, []);

  // Render question type selector
  const renderTypeSelector = useMemo(
    () => (
      <FormControl fullWidth margin="normal">
        <InputLabel>Question Type</InputLabel>
        <Select
          value={newQuestion.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          label="Question Type"
        >
          <MenuItem value={QuestionTypes.MULTIPLE_CHOICE}>
            Multiple Choice
          </MenuItem>
          <MenuItem value={QuestionTypes.SINGLE_CHOICE}>Single Choice</MenuItem>
          <MenuItem value={QuestionTypes.TRUE_FALSE}>True/False</MenuItem>
          <MenuItem value={QuestionTypes.TEXT}>Text Answer</MenuItem>
          <MenuItem value={QuestionTypes.ORDERING}>Ordering</MenuItem>
        </Select>
      </FormControl>
    ),
    [newQuestion.type, handleTypeChange]
  );

  // Render choices editor
  const renderChoicesEditor = useMemo(() => {
    if (newQuestion.type === QuestionTypes.TEXT) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Answer Choices
        </Typography>

        {newQuestion.choices.map((choice, index) => (
          <ChoiceEditor
            key={choice.id}
            choice={choice}
            index={index}
            questionType={newQuestion.type}
            onUpdate={updateChoice}
            onRemove={removeChoice}
            onMove={moveChoice}
            canRemove={newQuestion.choices.length > 2}
          />
        ))}

        {newQuestion.type !== QuestionTypes.TRUE_FALSE && (
          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              addChoice(
                newQuestion.type === QuestionTypes.ORDERING,
                newQuestion.choices.length
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
    newQuestion.type,
    newQuestion.choices,
    updateChoice,
    removeChoice,
    moveChoice,
    addChoice,
  ]);

  const renderQuestionCreator = useMemo(
    () => (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Create New Question
        </Typography>

        {renderTypeSelector}

        {newQuestion.type && (
          <>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Question"
              value={newQuestion.question}
              onChange={(e) => updateQuestionText(e.target.value)}
              margin="normal"
              placeholder="Enter your question here..."
            />

            {renderChoicesEditor}

            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveQuestion}
                disabled={loading || !newQuestion.question.trim()}
              >
                Save Question
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => {
                  setNewQuestion({ type: "", question: "", choices: [] });
                  setIsCreating(false);
                }}
              >
                Cancel
              </Button>
            </Box>
          </>
        )}
      </Paper>
    ),
    [
      newQuestion,
      renderTypeSelector,
      renderChoicesEditor,
      updateQuestionText,
      saveQuestion,
      loading,
    ]
  );

  return (
    <Container maxWidth="lg">
      <Box display="flex" gap={2}>
        <Typography variant="h4" gutterBottom>
          Test Questions
        </Typography>
      </Box>
      {reOrder && (
        <Button
          variant="contained"
          onClick={saveReOrdering}
          sx={{ position: "fixed", top: 100, right: 100, zIndex: 1500 }}
        >
          Save new orders
        </Button>
      )}

      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Test - ID: {testId}
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* Create Question Button */}
      {!isCreating && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsCreating(true)}
          sx={{ mb: 3 }}
          disabled={editingQuestionId !== null}
        >
          Create New Question
        </Button>
      )}

      {/* Question Creator */}
      {isCreating && renderQuestionCreator}

      {/* Saved Questions */}
      {questions.length > 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Questions ({questions.length})
          </Typography>
          {questions.map((question, index) => (
            <SavedQuestion
              key={question.id}
              questionId={question.id}
              questions={questions}
              setQuestions={setQuestions}
              testId={testId}
              index={index}
              moveQuestion={moveQuestion}
              setDeleteDialog={setDeleteDialog}
            />
          ))}
        </Box>
      )}

      {questions.length === 0 && !isCreating && (
        <Paper sx={{ p: 4, textAlign: "center", mt: 3 }}>
          <Typography variant="h6" color="text.secondary">
            No questions created yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click "Create New Question" to get started
          </Typography>
        </Paper>
      )}

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, questionId: null })}
      >
        <DialogTitle>Delete Question</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this question? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, questionId: null })}
          >
            Cancel
          </Button>
          <Button
            onClick={() => deleteQuestion(deleteDialog.questionId)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TestQuestionManager;

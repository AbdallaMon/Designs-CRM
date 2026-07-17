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
  IconButton,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  Divider,
  Stack,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  MdAdd as AddIcon,
  MdSave as SaveIcon,
  MdEdit as EditIcon,
  MdDelete as DeleteIcon,
  MdCancel as CancelIcon,
  MdExpandMore as ExpandMoreIcon,
  MdArrowUpward as ArrowUpIcon,
  MdArrowDownward as ArrowDownIcon,
  MdArrowUpward,
  MdArrowDownward,
} from "react-icons/md";
import { QuestionTypes } from "@/app/helpers/constants";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

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
      url: `admin/courses/tests/${testId}`,
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
      `admin/courses/tests/${testId}/test-questions`,
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
        `admin/courses/tests/${testId}/test-questions/${questionId}`,
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
      `admin/courses/tests/${testId}/test-questions/re-order`,
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

const ChoiceEditor = React.memo(
  ({ choice, index, questionType, onUpdate, onRemove, onMove, canRemove }) => {
    const handleTextChange = useCallback(
      (e) => {
        onUpdate(choice.id, "text", e.target.value);
      },
      [choice.id, onUpdate]
    );

    const handleCorrectChange = useCallback(
      (e) => {
        onUpdate(choice.id, "isCorrect", e.target.checked);
      },
      [choice.id, onUpdate]
    );

    const handleRadioChange = useCallback(() => {
      onUpdate(choice.id, "isCorrect", true);
    }, [choice.id, onUpdate]);

    const handleRemove = useCallback(() => {
      onRemove(choice.id);
    }, [choice.id, onRemove]);

    const handleMoveUp = useCallback(() => {
      onMove(choice.id, "up");
    }, [choice.id, onMove]);

    const handleMoveDown = useCallback(() => {
      onMove(choice.id, "down");
    }, [choice.id, onMove]);

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TextField
              fullWidth
              label={`Choice ${index + 1}`}
              value={choice.text}
              onChange={handleTextChange}
              disabled={questionType === QuestionTypes.TRUE_FALSE}
            />

            {questionType === QuestionTypes.MULTIPLE_CHOICE ? (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={choice.isCorrect}
                    onChange={handleCorrectChange}
                  />
                }
                label="Correct"
              />
            ) : questionType === QuestionTypes.ORDERING ? (
              <>
                <IconButton onClick={handleMoveUp}>
                  <MdArrowUpward />
                </IconButton>
                <IconButton onClick={handleMoveDown}>
                  <MdArrowDownward />
                </IconButton>
              </>
            ) : (
              <FormControlLabel
                control={
                  <Radio
                    checked={choice.isCorrect}
                    onChange={handleRadioChange}
                  />
                }
                label="Correct"
              />
            )}

            {questionType !== QuestionTypes.TRUE_FALSE && canRemove && (
              <IconButton onClick={handleRemove} color="error">
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }
);

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
        url: `admin/courses/tests/${testId}/test-questions/${questionId}`,
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
        `admin/courses/tests/${testId}/test-questions/${questionId}`,
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

export default TestQuestionManager;

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Checkbox,
  FormGroup,
  Alert,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  debounce,
} from "@mui/material";
import {
  FaClock,
  FaPlay,
  FaEye,
  FaCheck,
  FaTimes,
  FaArrowLeft,
  FaThumbsUp,
  FaThumbsDown,
  FaMinus,
  FaPlus,
} from "react-icons/fa";
import { useAuth } from "@/app/providers/AuthProvider";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";

import dayjs from "dayjs";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { MdPlusOne } from "react-icons/md";

const ReviewAttempts = ({ testId = 1, userId }) => {
  const [test, setTest] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("attempts");
  const [selectedAttemptForReview, setSelectedAttemptForReview] =
    useState(null);
  const [approvalLoading, setApprovalLoading] = useState({});
  const { setToastLoading } = useToastContext();

  async function getTest() {
    const req = await getDataAndSet({
      url: `shared/courses/tests/${testId}`,
      setLoading,
      setData: setTest,
    });
    return req?.data;
  }

  async function getTestQuestions() {
    const req = await getDataAndSet({
      url: `shared/courses/tests/${testId}/test-questions`,
      setData: setQuestions,
      setLoading,
    });
    return req?.data;
  }

  async function getUserAttempts() {
    const req = await getDataAndSet({
      url: `admin/courses/tests/${testId}/attampts/user?userId=${userId}&`,
      setLoading,
      setData: setAttempts,
    });
    return req?.data;
  }

  // New function to handle text answer approval
  const handleTextAnswerApproval = async (
    attemptId,
    questionId,
    isApproved
  ) => {
    const approvalKey = `${attemptId}_${questionId}`;
    setApprovalLoading((prev) => ({ ...prev, [approvalKey]: true }));

    try {
      const req = await handleRequestSubmit(
        { isApproved },
        setToastLoading,
        `admin/courses/tests/${testId}/attempts/${attemptId}/questions/${questionId}/approve`
      );

      if (req.status === 200) {
        // Update the selected attempt with the new approval status
        setSelectedAttemptForReview((prev) => ({
          ...prev,
          answers: prev.answers.map((answer) =>
            answer.questionId === questionId
              ? { ...answer, isApproved }
              : answer
          ),
        }));
        setAttempts((prev) =>
          prev.map((attempt) =>
            attempt.id === attemptId
              ? {
                  ...attempt,
                  answers: attempt.answers.map((answer) =>
                    answer.questionId === questionId
                      ? { ...answer, isApproved }
                      : answer
                  ),
                }
              : attempt
          )
        );
      } else {
        throw new Error("Failed to update approval status");
      }
    } catch (error) {
      console.error("Error updating approval:", error);
      // You might want to show an error message to the user here
    } finally {
      setApprovalLoading((prev) => ({ ...prev, [approvalKey]: false }));
    }
  };

  useEffect(() => {
    loadTestData();
  }, [testId, userId]);

  const loadTestData = async () => {
    await Promise.all([getTest(), getTestQuestions(), getUserAttempts()]);
  };

  const renderAttemptsList = () => (
    <Box dir="rtl">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5">محاولات الاختبار</Typography>
      </Box>

      {attempts.length === 0 ? (
        <Alert severity="info">لا توجد محاولات بعد.</Alert>
      ) : (
        <List>
          {attempts.map((attempt, index) => (
            <Paper key={attempt.id} sx={{ mb: 2 }}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography variant="h6">
                        المحاولة {attempt.attemptCount}
                      </Typography>
                      {attempt.endTime ? (
                        <Chip
                          label={attempt.passed ? "نجح" : "فشل"}
                          color={attempt.passed ? "success" : "error"}
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="قيد التقييم"
                          color="warning"
                          size="small"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        بدأ في:{" "}
                        {dayjs(attempt.startTime).format("DD/MM/YYYY - HH:mm")}
                      </Typography>
                      {attempt.endTime && (
                        <>
                          <Typography variant="body2">
                            انتهى في:{" "}
                            {dayjs(attempt.endTime).format(
                              "DD/MM/YYYY - HH:mm"
                            )}
                          </Typography>
                          <Typography variant="body2">
                            النتيجة: {attempt.score}%
                          </Typography>
                        </>
                      )}
                    </Box>
                  }
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<FaEye />}
                    onClick={() => {
                      setSelectedAttemptForReview(attempt);
                      setViewMode("review");
                    }}
                  >
                    مراجعة
                  </Button>
                </Box>
              </ListItem>
            </Paper>
          ))}
        </List>
      )}
    </Box>
  );

  const renderReviewView = () => {
    if (!selectedAttemptForReview) return null;

    const reviewAnswers = {};
    selectedAttemptForReview.answers.forEach((answer) => {
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
          <Button
            startIcon={<FaArrowLeft />}
            onClick={() => setViewMode("attempts")}
          >
            العودة للمحاولات
          </Button>
          <Typography variant="h5">
            مراجعة المحاولة {selectedAttemptForReview.attemptCount}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          النتيجة: {selectedAttemptForReview.score}% | الحالة:{" "}
          {selectedAttemptForReview.passed ? "نجح" : "فشل"} | الوقت المستغرق:{" "}
          {selectedAttemptForReview.timePassed} دقيقة
        </Alert>

        {questions.map((question, index) => (
          <Card key={question.id} sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Typography variant="h6">السؤال {index + 1}</Typography>
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
                selectedAttempt={selectedAttemptForReview}
                onApprovalChange={handleTextAnswerApproval}
                approvalLoading={approvalLoading}
              />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  // Helper function to translate question types
  const getQuestionTypeInArabic = (type) => {
    const translations = {
      MULTIPLE_CHOICE: "اختيار متعدد",
      SINGLE_CHOICE: "اختيار واحد",
      TRUE_FALSE: "صح أم خطأ",
      TEXT: "إجابة نصية",
      ORDERING: "ترتيب",
    };
    return translations[type] || type;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!test) {
    return (
      <Alert severity="error">
        الاختبار غير موجود أو ليس لديك صلاحية للوصول إليه.
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: "1200px", mx: "auto", p: 3 }} dir="rtl">
      {/* Test Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {test.title}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Chip label={test.type} variant="outlined" />
          <Chip
            label={`${
              attempts && attempts.length > 0
                ? attempts[attempts.length - 1].attemptLimit
                : test.attemptLimit
            } محاولات مسموحة`}
            variant="outlined"
          />
          {test.timeLimit && (
            <Chip label={`${test.timeLimit} دقيقة`} variant="outlined" />
          )}
        </Box>
        <Typography variant="body1" color="text.secondary">
          {test.course
            ? `الدورة: ${test.course?.title}`
            : `الدرس: ${test.lesson?.title}`}
        </Typography>
        {attempts && attempts.length > 0 && (
          <Box>
            <Box>
              <strong>الاسم</strong> :{attempts[0].user.name}
            </Box>
            <Box>
              <strong>البريد الإلكتروني</strong> :{attempts[0].user.email}
            </Box>
          </Box>
        )}
        <AttemptsLimit
          attempts={attempts}
          setAttempts={setAttempts}
          testId={testId}
          userId={userId}
        />
      </Paper>

      {viewMode === "attempts" && renderAttemptsList()}
      {viewMode === "review" && renderReviewView()}
    </Box>
  );
};

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
  if (question.type === "ORDERING") {
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
  const debouncedSave = useCallback(
    debounce((value) => {
      handleChange({ textAnswer: value });
    }, 500),
    []
  );

  const handleLocalChange = (e) => {
    setLocalText(e.target.value);
    debouncedSave(e.target.value);
  };

  const approvalKey = `${selectedAttempt?.id}_${question.id}`;
  const isApprovalLoading = approvalLoading[approvalKey];

  switch (question.type) {
    case "MULTIPLE_CHOICE":
      return (
        <FormControl
          component="fieldset"
          fullWidth
          disabled={isReview}
          dir="rtl"
        >
          <FormLabel component="legend">اختر جميع الإجابات الصحيحة:</FormLabel>
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

    case "SINGLE_CHOICE":
      return (
        <FormControl
          component="fieldset"
          fullWidth
          disabled={isReview}
          dir="rtl"
        >
          <FormLabel component="legend">اختر إجابة واحدة:</FormLabel>
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

    case "TRUE_FALSE":
      return (
        <FormControl
          component="fieldset"
          fullWidth
          disabled={isReview}
          dir="rtl"
        >
          <FormLabel component="legend">صح أم خطأ:</FormLabel>
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
                      ? "صح"
                      : choice.text === "False"
                      ? "خطأ"
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

    case "TEXT":
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
                    "اعتمالد هذه الاجابة؟"
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
                    "رفض هذا السؤال"
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
            placeholder="أدخل إجابتك هنا..."
            disabled={isReview}
            dir="rtl"
          />
        </Box>
      );

    case "ORDERING":
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

function AttemptsLimit({ attempts, setAttempts, testId, userId }) {
  const { setToastLoading } = useToastContext();
  if (!attempts || attempts.length === 0) return;

  async function increaseAllowedAttempts() {
    const req = await handleRequestSubmit(
      {},
      setToastLoading,
      `admin/courses/tests/${testId}/attempts/increase?userId=${userId}&`,
      false,
      "جاري التحديث",
      false
    );
    if (req.status === 200) {
      setAttempts((old) =>
        old.map((attempt, index) =>
          index === old.length - 1
            ? { ...attempt, attemptLimit: attempt.attemptLimit + 1 }
            : attempt
        )
      );
    }
  }

  async function decreaseAllowedAttempts() {
    const req = await handleRequestSubmit(
      {},
      setToastLoading,
      `admin/courses/tests/${testId}/attempts/decrease?userId=${userId}&`,
      false,
      "جاري التحديث",
      false
    );
    if (req.status === 200) {
      setAttempts((old) =>
        old.map((attempt, index) =>
          index === old.length - 1
            ? { ...attempt, attemptLimit: attempt.attemptLimit - 1 }
            : attempt
        )
      );
    }
  }

  return (
    <Box
      sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1.5 }}
      dir="rtl"
    >
      <Button
        startIcon={<FaPlus />}
        onClick={increaseAllowedAttempts}
        variant="outlined"
      >
        زيادة المحاولات المسموحة
      </Button>
      <Button
        startIcon={<FaMinus />}
        onClick={decreaseAllowedAttempts}
        variant="outlined"
      >
        تقليل المحاولات المسموحة
      </Button>
    </Box>
  );
}

export default ReviewAttempts;

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
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepButton,
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
  FaArrowRight,
  FaEdit,
  FaQuestionCircle,
} from "react-icons/fa";
import { useAuth } from "@/app/providers/AuthProvider";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import dayjs from "dayjs";
import { MdArrowDownward, MdArrowUpward } from "react-icons/md";
import CombinedHomeWork from "../../lessons/staff/CombinedHomeWork";
import { QuestionTypesLabels } from "@/app/helpers/constants";

const TestComponent = ({
  courseId,
  testId = 1,
  onComplete,
  setCompleted,
  mustAddHomeWork,
}) => {
  const [test, setTest] = useState(null);
  const { user } = useAuth();
  const userId = user?.id;
  const [attempts, setAttempts] = useState([]);
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showNewAttemptDialog, setShowNewAttemptDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("attempts"); // 'attempts', 'test', 'review'
  const [selectedAttemptForReview, setSelectedAttemptForReview] =
    useState(null);
  const [savingAnswers, setSavingAnswers] = useState([]);
  const [errorQuestions, setErrorQuestions] = useState([]);

  const examType = "FULLPAGE";
  const { toastLoading, setToastLoading } = useToastContext();
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
      url: `shared/courses/tests/${testId}/attampts`,
      setLoading,
      setData: setAttempts,
    });
    return req?.data;
  }
  async function createAttempt() {
    const req = await handleRequestSubmit(
      {},
      setToastLoading,
      `shared/courses/tests/${testId}/attampts`,
      false,
      "جاري الإنشاء"
    );
    if (req.status === 200) {
      await getUserAttempts();
      return req.data;
    }
  }
  async function saveAnswer(attemptId, questionId, answer) {
    setSavingAnswers((prev) => [...prev, questionId]);
    const request = await fetch(
      process.env.NEXT_PUBLIC_URL +
        "/" +
        `shared/courses/tests/${testId}/attampts/${attemptId}/questions/${questionId}`,
      {
        method: "POST",
        body: JSON.stringify({ answer }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    await request.json();
    if (request.status === 200) {
      setSavingAnswers((prev) => prev.filter((id) => id !== questionId));
      setErrorQuestions((prev) => prev.filter((id) => id !== questionId));
    }
  }

  useEffect(() => {
    loadTestData();
  }, [testId, userId]);

  const loadTestData = async () => {
    setLoading(true);
    try {
      const [test, , attemptsData] = await Promise.all([
        getTest(),
        getTestQuestions(),
        getUserAttempts(),
      ]);
      const ongoingAttempt = attemptsData.find((a) => !a.endTime);
      if (ongoingAttempt) {
        setCurrentAttempt(ongoingAttempt);
        setViewMode("test");
        loadUserAnswers(ongoingAttempt.answers);
        startTimer(ongoingAttempt, test);
      }
    } catch (error) {
      console.error("خطأ في تحميل بيانات الاختبار:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserAnswers = (answers) => {
    const answersMap = {};
    answers.forEach((answer) => {
      answersMap[answer.questionId] = {
        selectedAnswers: answer.selectedAnswers.map((sa) => sa.value),
        textAnswer: answer.textAnswer,
      };
    });
    setUserAnswers(answersMap);
  };

  const startTimer = (attempt, test) => {
    if (!test?.timeLimit) return;

    const startTime = new Date(attempt.startTime);
    const now = new Date();
    const elapsedMinutes = Math.floor((now - startTime) / (1000 * 60));
    const remainingMinutes = test.timeLimit - elapsedMinutes;

    if (remainingMinutes > 0) {
      setTimeLeft(remainingMinutes * 60);
      setIsTimerRunning(true);
    } else {
      if (attempt) {
        handleSubmitAttempt(attempt, test);
      }
    }
  };

  useEffect(() => {
    let interval;
    if (!isTimerRunning || timeLeft === 0) {
      if (currentAttempt) {
        handleSubmitAttempt();
      }
    }
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, , currentAttempt]);
  useEffect(() => {}, []);
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${toArabicNumerals(mins)}:${toArabicNumerals(
      secs.toString().padStart(2, "0")
    )}`;
  };
  const handleStartNewAttempt = async () => {
    try {
      const newAttempt = await createAttempt();
      if (!newAttempt) return;
      setCurrentAttempt(newAttempt);
      setUserAnswers({});
      setViewMode("test");
      setShowNewAttemptDialog(false);

      if (test?.timeLimit) {
        setTimeLeft(test.timeLimit * 60);
        setIsTimerRunning(true);
      }
    } catch (error) {
      console.error("خطأ في بدء محاولة جديدة:", error);
    }
  };
  const handleAnswerChange = async (questionId, answer) => {
    const newAnswers = { ...userAnswers, [questionId]: answer };

    setUserAnswers(newAnswers);
    if (currentAttempt) {
      try {
        await saveAnswer(currentAttempt.id, questionId, answer);
      } catch (error) {
        console.error("خطأ في حفظ الإجابة:", error);
      }
    }
  };

  const handleSubmitAttempt = async (attempt, preLoadedTest) => {
    const now = new Date();
    const startTime = new Date(
      !currentAttempt ? attempt.startTime : currentAttempt.startTime
    );
    const timeLimitMs =
      (!test ? preLoadedTest.timeLimit : test.timeLimit) * 60 * 1000; // minutes to ms
    const expireTime = new Date(startTime.getTime() + timeLimitMs);

    const isTimeLeft = now < expireTime;
    if (isTimeLeft) {
      if (savingAnswers?.length > 0) {
        return;
      }
      const unansweredQuestions = questions.filter((q) => !userAnswers[q.id]);
      const incompleteQuestions = questions.filter((q) => {
        const answer = userAnswers[q.id];
        if (!answer) return false;
        const noText = !answer.textAnswer || answer.textAnswer.trim() === "";
        const noChoices =
          !answer.selectedAnswers || answer.selectedAnswers.length === 0;
        return noText && noChoices;
      });

      const errorIds = [
        ...unansweredQuestions.map((q) => q.id),
        ...incompleteQuestions.map((q) => q.id),
      ];

      setErrorQuestions(errorIds);

      if (errorIds.length > 0) {
        const element = document.getElementById(`question-${errorIds[0]}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
    }

    if (!currentAttempt && !attempt) return;

    try {
      setIsTimerRunning(false);
      const req = await handleRequestSubmit(
        {},
        setToastLoading,
        `shared/courses/tests/${testId}/attampts/${
          !currentAttempt ? attempt.id : currentAttempt.id
        }`,
        false,
        "جاري الحفظ",
        false,
        "PUT"
      );
      if (req.status === 200) {
        if (req.data.passed) {
          if (onComplete) {
            onComplete();
          }
          if (setCompleted) {
            setCompleted(true);
          }
        }
        await getUserAttempts();
        setViewMode("attempts");
        setUserAnswers({});
        setCurrentAttempt(null);
        setTimeLeft(0);
      }
    } catch (error) {
      console.error("خطأ في إرسال المحاولة:", error);
    }
  };
  const lastAttempt = attempts?.length ? attempts[attempts.length - 1] : null;
  const attemptLimit = test
    ? Math.max(lastAttempt?.attemptLimit ?? 0, test.attemptLimit)
    : 0;

  const canStartNewAttempt = () => {
    if (!test) return false;
    const completedAttempts = attempts.filter((a) => a.endTime).length;
    const ongoingAttempt = attempts.find((a) => !a.endTime);

    return (
      !attempts ||
      attempts.length === 0 ||
      (completedAttempts < attemptLimit && !ongoingAttempt)
    );
  };

  const isAttemptExpired = (attempt, test) => {
    if (attempt.endTime) return true;

    const startTime = new Date(attempt.startTime).getTime(); // ms
    const now = Date.now(); // ms
    const elapsedMinutes = (now - startTime) / 1000 / 60;

    return elapsedMinutes >= test.timeLimit;
  };

  const renderAttemptsList = () => (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5">محاولات الاختبار</Typography>
        {canStartNewAttempt() && (
          <Button
            variant="contained"
            startIcon={<FaPlay />}
            onClick={() => setShowNewAttemptDialog(true)}
          >
            بدء محاولة جديدة
          </Button>
        )}
      </Box>

      {attempts.length === 0 ? (
        <Alert severity="info">
          لا توجد محاولات بعد. اضغط على "بدء محاولة جديدة" للبداية.
        </Alert>
      ) : (
        <List>
          {attempts.map((attempt, index) => (
            <Paper key={attempt.id} sx={{ mb: 2 }}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography variant="h6">
                        المحاولة {toArabicNumerals(attempt.attemptCount)}
                      </Typography>
                      {attempt.endTime ? (
                        <Chip
                          label={attempt.passed ? "نجح" : "فشل"}
                          color={attempt.passed ? "success" : "error"}
                          size="small"
                        />
                      ) : (
                        <Chip label="قيد التقدم" color="warning" size="small" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          بدأت في:{" "}
                          {dayjs(attempt.startTime).format(
                            "DD/MM/YYYY - HH:mm"
                          )}
                        </Typography>
                        {attempt.endTime && (
                          <>
                            <Typography variant="body2">
                              اكتملت في:{" "}
                              {dayjs(attempt.endTime).format(
                                "DD/MM/YYYY - HH:mm"
                              )}
                            </Typography>
                            <Typography variant="body2">
                              النتيجة: {toArabicNumerals(attempt.score)}%
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  }
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  {isAttemptExpired(attempt, test) ? (
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
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<FaEdit />}
                      onClick={() => {
                        setCurrentAttempt(attempt);
                        setViewMode("test");
                        loadUserAnswers(attempt.answers);
                        startTimer(attempt, test);
                      }}
                    >
                      متابعة
                    </Button>
                  )}
                </Box>
              </ListItem>
            </Paper>
          ))}
        </List>
      )}
    </Box>
  );

  const renderAllQuestionsView = () => {
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
          <Button
            startIcon={<FaArrowLeft />}
            onClick={() => setViewMode("attempts")}
          >
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
            onClick={handleSubmitAttempt}
          >
            احفظ الاختبار
          </Button>
        </Box>
      </Box>
    );
  };
  function toArabicNumerals(number) {
    if (!number) return number;
    return number.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
  }

  const renderReviewView = () => {
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
          <Button
            startIcon={<FaArrowLeft />}
            onClick={() => setViewMode("attempts")}
          >
            العودة إلى المحاولات
          </Button>
          <Typography variant="h5">
            مراجعة المحاولة{" "}
            {toArabicNumerals(selectedAttemptForReview.attemptCount)}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          النتيجة: {toArabicNumerals(selectedAttemptForReview.score)}% | الحالة:{" "}
          {selectedAttemptForReview.passed ? "نجح" : "فشل"}
        </Alert>

        {questions.map((question, index) => (
          <Card key={question.id} sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Typography variant="h6">
                  السؤال {toArabicNumerals(index + 1)}
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

  if (loading || !test) {
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

  if (!test && !loading && !attempts) {
    return (
      <Alert severity="error">
        الاختبار غير موجود أو ليس لديك صلاحية للوصول إليه.
      </Alert>
    );
  }
  if (!test) return;
  return (
    <Box sx={{ maxWidth: "1200px", mx: "auto", p: 3 }}>
      {/* Test Header */}
      {viewMode !== "test" && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {test.title}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <Chip label={test.type} variant="outlined" />
            <Chip
              label={`${toArabicNumerals(attemptLimit)} محاولات مسموحة`}
              variant="outlined"
            />
            {test.timeLimit && (
              <Chip
                label={`${toArabicNumerals(test.timeLimit)} دقيقة`}
                variant="outlined"
              />
            )}
          </Box>
          <Typography variant="body1" color="text.secondary">
            {test.course
              ? `الكورس: ${test.course?.title}`
              : `الدرس: ${test.lesson?.title}`}
          </Typography>
          {!test.course &&
            test.lessonId &&
            attempts &&
            attempts.find((attempt) => attempt.passed) &&
            mustAddHomeWork && (
              <Box sx={{ mt: 2 }}>
                <CombinedHomeWork
                  courseId={courseId}
                  lessonId={test.lessonId}
                  onUpdate={() => {
                    if (onComplete) {
                      onComplete();
                    }
                    if (setCompleted) {
                      setCompleted(true);
                    }
                  }}
                />
              </Box>
            )}
        </Paper>
      )}

      {viewMode === "attempts" && renderAttemptsList()}
      {viewMode === "test" &&
        examType === "FULLPAGE" &&
        renderAllQuestionsView()}
      {viewMode === "review" && renderReviewView()}

      <Dialog
        open={showNewAttemptDialog}
        onClose={() => setShowNewAttemptDialog(false)}
      >
        <DialogTitle>بدء محاولة اختبار جديدة</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            أنت على وشك بدء محاولة اختبار جديدة.
            {test.timeLimit &&
              ` سيكون لديك ${toArabicNumerals(
                test.timeLimit
              )} دقيقة لإكمال الاختبار.`}
          </Typography>
          <Alert severity="warning">
            تأكد من أن لديك اتصال إنترنت مستقر ووقت كافي لإكمال الاختبار.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewAttemptDialog(false)}>إلغاء</Button>
          <Button onClick={handleStartNewAttempt} variant="contained">
            بدء الاختبار
          </Button>
        </DialogActions>
      </Dialog>
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
}) => {
  const currentAnswer = isReview
    ? reviewAnswers?.[question.id]
    : userAnswers[question.id];
  let [saved, setSaved] = useState(false);
  const handleChange = (answer) => {
    if (!isReview) {
      handleAnswerChange(question.id, answer);
    }
  };

  const getOrderedChoices = () => {
    if (
      currentAnswer?.selectedAnswers &&
      currentAnswer.selectedAnswers.length > 0
    ) {
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
    } else if (!isReview) {
      const newChoices = [...question.choices].sort(() => Math.random() - 0.5);
      if (!saved) {
        handleChange({ selectedAnswers: newChoices.map((c) => c.text) });
        setSaved(true);
      }
      return newChoices;
    }
    {
      return [...question.choices].sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );
    }
  };

  const moveChoice = (currentIndex, direction) => {
    const orderedChoices = getOrderedChoices();
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
  const debouncedSave = useCallback(
    debounce((value) => {
      handleChange({ textAnswer: value });
    }, 500),
    [userAnswers]
  );

  const handleLocalChange = (e) => {
    setLocalText(e.target.value);
    debouncedSave(e.target.value);
  };

  switch (question.type) {
    case "MULTIPLE_CHOICE":
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

    case "SINGLE_CHOICE":
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

    case "TRUE_FALSE":
      return (
        <FormControl component="fieldset" fullWidth disabled={isReview}>
          <FormLabel component="legend">صح ام خطاء:</FormLabel>
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
                    {choice.text === "True" ? "صح" : "خطاء"}
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

    case "TEXT":
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

    case "ORDERING":
      const orderedChoices = getOrderedChoices();

      return (
        <FormControl component="fieldset" fullWidth disabled={isReview}>
          <FormLabel component="legend">
            استخدم الاسهم لتحريك الاجابات
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
export default TestComponent;

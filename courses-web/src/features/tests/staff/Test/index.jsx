"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useAuth } from "@/app/providers/AuthProvider";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import CombinedHomeWork from "../../../lessons/staff/CombinedHomeWork";
import { toArabicNumerals } from "./helpers";
import AttemptsList from "./components/AttemptsList";
import AllQuestionsView from "./components/AllQuestionsView";
import ReviewView from "./components/ReviewView";
import NewAttemptDialog from "./components/NewAttemptDialog";

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
    // timeLeft MUST be a dependency: the body reads it to decide auto-submit, and the
    // interval recreates each tick via the functional setTimeLeft updater (idempotent).
  }, [isTimerRunning, timeLeft, currentAttempt]);
  useEffect(() => {}, []);
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

      {viewMode === "attempts" && (
        <AttemptsList
          attempts={attempts}
          test={test}
          canStartNewAttempt={canStartNewAttempt}
          onStartNewAttempt={() => setShowNewAttemptDialog(true)}
          isAttemptExpired={isAttemptExpired}
          onReview={(attempt) => {
            setSelectedAttemptForReview(attempt);
            setViewMode("review");
          }}
          onContinue={(attempt) => {
            setCurrentAttempt(attempt);
            setViewMode("test");
            loadUserAnswers(attempt.answers);
            startTimer(attempt, test);
          }}
        />
      )}
      {viewMode === "test" && examType === "FULLPAGE" && (
        <AllQuestionsView
          questions={questions}
          test={test}
          timeLeft={timeLeft}
          savingAnswers={savingAnswers}
          errorQuestions={errorQuestions}
          userAnswers={userAnswers}
          attempts={attempts}
          onBack={() => setViewMode("attempts")}
          handleAnswerChange={handleAnswerChange}
          handleSubmitAttempt={handleSubmitAttempt}
        />
      )}
      {viewMode === "review" && (
        <ReviewView
          selectedAttemptForReview={selectedAttemptForReview}
          questions={questions}
          userAnswers={userAnswers}
          attempts={attempts}
          test={test}
          onBack={() => setViewMode("attempts")}
        />
      )}

      <NewAttemptDialog
        open={showNewAttemptDialog}
        onClose={() => setShowNewAttemptDialog(false)}
        test={test}
        onConfirm={handleStartNewAttempt}
      />
    </Box>
  );
};

export default TestComponent;

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
import { apiRequest } from "@/app/helpers/functions/apiClient";
import CombinedHomeWork from "../../../lessons/staff/CombinedHomeWork";
import { formatNumber } from "./helpers";
import AttemptsList from "./components/AttemptsList";
import AllQuestionsView from "./components/AllQuestionsView";
import ReviewView from "./components/ReviewView";
import NewAttemptDialog from "./components/NewAttemptDialog";
import { describeApiError } from "@/app/helpers/functions/richError";

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
      url: `staff-courses/tests/${testId}`,
      setLoading,
      setData: setTest,
    });
    return req?.data;
  }
  async function getTestQuestions() {
    const req = await getDataAndSet({
      url: `staff-courses/tests/${testId}/test-questions`,
      setData: setQuestions,
      setLoading,
    });
    return req?.data;
  }
  async function getUserAttempts() {
    const req = await getDataAndSet({
      url: `staff-courses/tests/${testId}/attampts`,
      setLoading,
      setData: setAttempts,
    });
    return req?.data;
  }
  async function createAttempt() {
    const req = await handleRequestSubmit(
      {},
      setToastLoading,
      `staff-courses/tests/${testId}/attampts`,
      false,
      "Creating"
    );
    if (req.status === 200) {
      await getUserAttempts();
      return req.data;
    }
  }
  async function saveAnswer(attemptId, questionId, answer) {
    setSavingAnswers((prev) => [...prev, questionId]);
    try {
      const request = await apiRequest(
        `staff-courses/tests/${testId}/attampts/${attemptId}/questions/${questionId}`,
        {
          method: "POST",
          body: JSON.stringify({ answer }),
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      const body = await request.json().catch(() => ({}));
      if (!request.ok || body.success === false) {
        setErrorQuestions((prev) => [...new Set([...prev, questionId])]);
        throw new Error(describeApiError(body).message);
      }
      setErrorQuestions((prev) => prev.filter((id) => id !== questionId));
    } finally {
      setSavingAnswers((prev) => prev.filter((id) => id !== questionId));
    }
  }

  async function loadTestData() {
    setLoading(true);
    try {
      const [test, , attemptsData] = await Promise.all([
        getTest(),
        getTestQuestions(),
        getUserAttempts(),
      ]);
      const ongoingAttempt = attemptsData?.find((a) => !a.endTime);
      if (ongoingAttempt) {
        setCurrentAttempt(ongoingAttempt);
        setViewMode("test");
        loadUserAnswers(ongoingAttempt.answers);
        startTimer(ongoingAttempt, test);
      }
    } catch (error) {
      console.error("Failed to load test data:", error);
    } finally {
      setLoading(false);
    }
  }

  function loadUserAnswers(answers) {
    const answersMap = {};
    answers.forEach((answer) => {
      answersMap[answer.questionId] = {
        selectedAnswers: answer.selectedAnswers.map((sa) => sa.value),
        textAnswer: answer.textAnswer,
      };
    });
    setUserAnswers(answersMap);
  }

  function startTimer(attempt, test) {
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
  }

  useEffect(() => {
    // Test data is synchronized from the API whenever the selected test/user changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTestData();
  }, [testId, userId]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const timeout = window.setTimeout(() => {
      if (timeLeft <= 1) {
        setIsTimerRunning(false);
        if (currentAttempt) handleSubmitAttempt();
        return;
      }
      setTimeLeft((previous) => Math.max(previous - 1, 0));
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [isTimerRunning, timeLeft, currentAttempt]);
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
      console.error("Failed to start a new attempt:", error);
    }
  };
  const handleAnswerChange = async (questionId, answer) => {
    const newAnswers = { ...userAnswers, [questionId]: answer };

    setUserAnswers(newAnswers);
    if (currentAttempt) {
      try {
        await saveAnswer(currentAttempt.id, questionId, answer);
      } catch (error) {
        console.error("Failed to save answer:", error);
      }
    }
  };

  async function handleSubmitAttempt(attempt, preLoadedTest) {
    const now = new Date();
    const activeAttempt = currentAttempt || attempt;
    const activeTest = test || preLoadedTest;
    const startTime = new Date(activeAttempt?.startTime);
    const expireTime = activeTest?.timeLimit
      ? new Date(startTime.getTime() + activeTest.timeLimit * 60 * 1000)
      : null;

    const shouldValidateAnswers = !expireTime || now < expireTime;
    if (shouldValidateAnswers) {
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
        `staff-courses/tests/${testId}/attampts/${
          !currentAttempt ? attempt.id : currentAttempt.id
        }`,
        false,
        "Saving",
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
      console.error("Failed to submit attempt:", error);
    }
  }
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
    if (!test?.timeLimit) return false;

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
        The test was not found or you do not have permission to access it.
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
              label={`${formatNumber(attemptLimit)} attempts allowed`}
              variant="outlined"
            />
            {test.timeLimit && (
              <Chip
                label={`${formatNumber(test.timeLimit)} minutes`}
                variant="outlined"
              />
            )}
          </Box>
          <Typography variant="body1" color="text.secondary">
            {test.course
              ? `Course: ${test.course?.title}`
              : `Lesson: ${test.lesson?.title}`}
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

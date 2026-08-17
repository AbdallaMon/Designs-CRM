import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { FaClock, FaPlay, FaThumbsDown } from "react-icons/fa";
import { useAuth } from "@/app/providers/AuthProvider";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";

import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { USER_FEEDBACK_MESSAGES as FEEDBACK } from "@dms/shared";
import { MdPlusOne } from "react-icons/md";

import AttemptsLimit from "./components/AttemptsLimit";
import AttemptsList from "./components/AttemptsList";
import ReviewView from "./components/ReviewView";

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
      url: `courses/tests/${testId}/attampts/user?userId=${userId}`,
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
        `courses/tests/${testId}/attempts/${attemptId}/questions/${questionId}/approve`
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
      throw new Error(FEEDBACK.APPROVAL_UPDATE_FAILED);
      }
    } catch (error) {
      console.error("Error updating approval:", error);
      // You might want to show an error message to the user here
    } finally {
      setApprovalLoading((prev) => ({ ...prev, [approvalKey]: false }));
    }
  };

  async function loadTestData() {
    await Promise.all([getTest(), getTestQuestions(), getUserAttempts()]);
  }

  useEffect(() => {
    loadTestData();
  }, [testId, userId]);

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
        The test was not found or you do not have permission to access it.
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
            } attempts allowed`}
            variant="outlined"
          />
          {test.timeLimit && (
            <Chip label={`${test.timeLimit} minutes`} variant="outlined" />
          )}
        </Box>
        <Typography variant="body1" color="text.secondary">
          {test.course
            ? `Course: ${test.course?.title}`
            : `Lesson: ${test.lesson?.title}`}
        </Typography>
        {attempts && attempts.length > 0 && (
          <Box>
            <Box>
              <strong>Name</strong> :{attempts[0].user.name}
            </Box>
            <Box>
              <strong>Email</strong> :{attempts[0].user.email}
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

      {viewMode === "attempts" && (
        <AttemptsList
          attempts={attempts}
          onReview={(attempt) => {
            setSelectedAttemptForReview(attempt);
            setViewMode("review");
          }}
        />
      )}
      {viewMode === "review" && (
        <ReviewView
          selectedAttempt={selectedAttemptForReview}
          questions={questions}
          attempts={attempts}
          test={test}
          onApprovalChange={handleTextAnswerApproval}
          approvalLoading={approvalLoading}
          onBack={() => setViewMode("attempts")}
        />
      )}
    </Box>
  );
};

export default ReviewAttempts;

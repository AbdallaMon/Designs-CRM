import React from "react";
import { Box, Button } from "@mui/material";
import { FaMinus, FaPlus } from "react-icons/fa";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

function AttemptsLimit({ attempts, setAttempts, testId, userId }) {
  const { setToastLoading } = useToastContext();
  if (!attempts || attempts.length === 0) return;

  async function increaseAllowedAttempts() {
    const req = await handleRequestSubmit(
      {},
      setToastLoading,
      `courses/tests/${testId}/attempts/increase?userId=${userId}&`,
      false,
      "Updating",
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
      `courses/tests/${testId}/attempts/decrease?userId=${userId}&`,
      false,
      "Updating",
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
        Increase allowed attempts
      </Button>
      <Button
        startIcon={<FaMinus />}
        onClick={decreaseAllowedAttempts}
        variant="outlined"
      >
        Decrease allowed attempts
      </Button>
    </Box>
  );
}

export default AttemptsLimit;

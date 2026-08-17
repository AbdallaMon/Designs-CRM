"use client";

import { Alert, Box, Typography } from "@mui/material";
import { FaCheckCircle } from "react-icons/fa";
import { TELEGRAM_AUTH_STATES } from "@dms/shared";

export default function RenderStepDescription({
  currentTelegramAuthStep,
  authError,
}) {
  if (
    currentTelegramAuthStep === TELEGRAM_AUTH_STATES.PHONE_NUMBER ||
    currentTelegramAuthStep === TELEGRAM_AUTH_STATES.INIT
  ) {
    return (
      <Typography variant="body2" color="text.secondary">
        Enter the phone number linked to your Telegram account. Include your
        country code (e.g., +971 for UAE).
      </Typography>
    );
  }
  if (currentTelegramAuthStep === TELEGRAM_AUTH_STATES.AWAIT_CODE) {
    return (
      <Typography variant="body2" color="text.secondary">
        A verification code was sent to your Telegram app. Enter it below to
        continue.
      </Typography>
    );
  }
  if (currentTelegramAuthStep === TELEGRAM_AUTH_STATES.REQUIRE_PASSWORD) {
    return (
      <Box display="flex" flexDirection="column" gap={1}>
        {authError ? (
          <Alert severity="error" sx={{ py: 0.5 }}>
            {authError}
          </Alert>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Your account has two-step verification enabled. Enter your Telegram
            password to proceed.
          </Typography>
        )}
      </Box>
    );
  }
  if (
    currentTelegramAuthStep ===
    TELEGRAM_AUTH_STATES.AWAIT_TO_REWRITE_2FA_PASSWORD
  ) {
    return (
      <Alert severity="error" sx={{ py: 0.5 }}>
        Incorrect password. Please try again.
      </Alert>
    );
  }
  if (currentTelegramAuthStep === TELEGRAM_AUTH_STATES.AWAIT_PASSWORD) {
    return (
      <Box display="flex" flexDirection="column" gap={1}>
        {authError ? (
          <Alert severity="error" sx={{ py: 0.5 }}>
            {authError}
          </Alert>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Your account requires a password. Enter your Telegram account
            password to continue.
          </Typography>
        )}
      </Box>
    );
  }
  if (currentTelegramAuthStep === TELEGRAM_AUTH_STATES.SUCCESS) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <FaCheckCircle style={{ color: "#2e7d32" }} />
        <Typography variant="body1" color="success.main" fontWeight={500}>
          Telegram account is successfully connected and active.
        </Typography>
      </Box>
    );
  }
  return null;
}

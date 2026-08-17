"use client";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  Paper,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import {
  FaCheckCircle,
  FaLock,
  FaMobileAlt,
  FaSms,
  FaTelegram,
  FaExclamationTriangle,
} from "react-icons/fa";
import { MuiTelInput, matchIsValidTel } from "mui-tel-input";
import { useEffect, useState } from "react";
import { TELEGRAM_CONSTANTS } from "@/features/users/profile/constant.js";
import RenderStepDescription from "@/features/users/profile/RenderStepDescription.jsx";
import RenderTelegramAuthInput from "@/features/users/profile/RenderTelegramAuthInput.jsx";
import {
  TELEGRAM_CONNECTION_STATUSES, INTEGRATION_ERROR_CODES,
  TELEGRAM_AUTH_STATES,
  USER_FEEDBACK_MESSAGES,
} from "@dms/shared";

const STEPS = ["Phone Number", "Verification Code", "Connected"];

const STEP_INDEX = {
  [TELEGRAM_AUTH_STATES.PHONE_NUMBER]: 0,
  [TELEGRAM_AUTH_STATES.INIT]: 0,
  [TELEGRAM_AUTH_STATES.AWAIT_CODE]: 1,
  [TELEGRAM_AUTH_STATES.REQUIRE_PASSWORD]: 1,
  [TELEGRAM_AUTH_STATES.AWAIT_TO_REWRITE_2FA_PASSWORD]: 1,
  [TELEGRAM_AUTH_STATES.AWAIT_PASSWORD]: 1,
  [TELEGRAM_AUTH_STATES.SUCCESS]: 2,
};

export default function TelegramAuth() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reAuthDialogOpen, setReAuthDialogOpen] = useState(false);
  const [authError, setAuthError] = useState(null);
  const { loading: toastLoading, setLoading: setToastLoading } =
    useToastContext();
  const [currentTelegramAuthStep, setCurrentTelegramAuthStep] =
    useState(TELEGRAM_AUTH_STATES.INIT);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    code: "",
    password: "",
  });

  async function getTelegramAuth() {
    const req = await getDataAndSet({
      url: "v2/telegram/current",
      setData,
      setError,
      setLoading,
    });
    if (req.status === 200) {
      if (req.data.status === TELEGRAM_CONNECTION_STATUSES.CONNECTED) {
        setCurrentTelegramAuthStep(TELEGRAM_AUTH_STATES.SUCCESS);
      }
    }
  }

  function handleReAuthClick() {
    setReAuthDialogOpen(true);
  }

  function confirmReAuth() {
    setReAuthDialogOpen(false);
    setCurrentTelegramAuthStep(TELEGRAM_AUTH_STATES.PHONE_NUMBER);
    setFormData({ phoneNumber: "", code: "", password: "" });
    setAuthError(null);
  }

  async function handleTelegramAuth() {
    const url =
      currentTelegramAuthStep === TELEGRAM_CONSTANTS.STATUS.init ||
      currentTelegramAuthStep === TELEGRAM_CONSTANTS.STATUS.PHONE_NUMBER
        ? "v2/telegram/auth/init"
        : currentTelegramAuthStep === TELEGRAM_CONSTANTS.STATUS.awaitCode
          ? "v2/telegram/auth/verify-code"
          : currentTelegramAuthStep ===
                TELEGRAM_CONSTANTS.STATUS.requirePassword ||
              currentTelegramAuthStep ===
                TELEGRAM_CONSTANTS.STATUS.reWritePassword ||
              currentTelegramAuthStep ===
                TELEGRAM_CONSTANTS.STATUS.awaitPassword
            ? "v2/telegram/auth/verify-password"
            : "v2/telegram/auth/init";
    setAuthError(null);
    const req = await handleRequestSubmit(
      { ...formData },
      setToastLoading,
      url,
      false,
      "Updating",
      false,
    );
    if (
      req?.message ===
      USER_FEEDBACK_MESSAGES.TELEGRAM_CODE_EXPIRED
    ) {
      setCurrentTelegramAuthStep(TELEGRAM_AUTH_STATES.INIT);
      return;
    }
    if (req?.message === INTEGRATION_ERROR_CODES.AUTH_KEY_UNREGISTERED) {
      setAuthError(USER_FEEDBACK_MESSAGES.TELEGRAM_SESSION_PASSWORD_INVALID);
      setCurrentTelegramAuthStep(TELEGRAM_AUTH_STATES.AWAIT_PASSWORD);
      setFormData((prev) => ({ ...prev, password: "" }));
      return;
    }
    // Any other failed step (e.g. a wrong 2FA password → 401 TELEGRAM_PASSWORD_INCORRECT)
    // must surface its message to the user instead of failing silently. Keep the user on
    // the current step so they can correct and retry.
    if (!req || req.status !== 200) {
      setAuthError(
        req?.message ||
          USER_FEEDBACK_MESSAGES.TELEGRAM_STEP_FAILED,
      );
      setFormData((prev) => ({ ...prev, password: "" }));
      return;
    }
    setCurrentTelegramAuthStep(req.data.teleStatus);
    if (req?.data?.teleStatus === TELEGRAM_AUTH_STATES.SUCCESS) {
      await getTelegramAuth();
    }
  }

  useEffect(() => {
    getTelegramAuth();
  }, []);

  const isConnected = currentTelegramAuthStep === TELEGRAM_AUTH_STATES.SUCCESS;
  const activeStep = STEP_INDEX[currentTelegramAuthStep] ?? 0;
  const isBusy = loading || toastLoading;
  const currentPhoneNumber = data?.phoneNumber || formData.phoneNumber;

  return (
    <>
      <Box mt={2}>
        <Divider />
        <Box mt={3} mb={1} display="flex" alignItems="center" gap={1.5}>
          <FaTelegram style={{ color: "#229ED9", fontSize: 28 }} />
          <Typography variant="h6" fontWeight={600}>
            Telegram Authentication
          </Typography>
          {isConnected && (
            <Chip
              label="Connected"
              size="small"
              icon={<FaCheckCircle />}
              color="success"
              variant="outlined"
            />
          )}
        </Box>

        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 3,
            border: "1px solid",
            borderColor: isConnected ? "success.light" : "divider",
            borderRadius: 2,
            bgcolor: isConnected ? "success.50" : "background.paper",
          }}
        >
          {loading ? (
            <Box display="flex" alignItems="center" gap={2} py={2}>
              <CircularProgress size={20} />
              <Typography color="text.secondary">
                Checking Telegram status...
              </Typography>
            </Box>
          ) : (
            <>
              {isConnected && data?.phoneNumber && (
                <Box mb={3}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    Authenticated account
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {data.phoneNumber}
                  </Typography>
                </Box>
              )}

              {!isConnected && (
                <Box mb={3}>
                  <Stepper activeStep={activeStep} alternativeLabel>
                    {STEPS.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>
              )}

              <RenderStepDescription
                currentTelegramAuthStep={currentTelegramAuthStep}
                authError={authError}
              />

              {!isConnected && (
                <Box mt={2}>
                  <RenderTelegramAuthInput
                    currentTelegramAuthStep={currentTelegramAuthStep}
                    formData={formData}
                    setFormData={setFormData}
                  />
                </Box>
              )}

              <Box mt={3} display="flex" gap={2} flexWrap="wrap">
                {!isConnected && (
                  <Button
                    variant="contained"
                    onClick={handleTelegramAuth}
                    disabled={isBusy}
                    startIcon={
                      isBusy ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : null
                    }
                    sx={{ minWidth: 160 }}
                  >
                    {isBusy
                      ? "Processing..."
                      : currentTelegramAuthStep === TELEGRAM_AUTH_STATES.INIT ||
                          currentTelegramAuthStep ===
                            TELEGRAM_AUTH_STATES.PHONE_NUMBER
                        ? "Send Code"
                        : currentTelegramAuthStep ===
                            TELEGRAM_AUTH_STATES.AWAIT_CODE
                          ? "Verify Code"
                          : currentTelegramAuthStep ===
                                TELEGRAM_AUTH_STATES.REQUIRE_PASSWORD ||
                              currentTelegramAuthStep ===
                                TELEGRAM_AUTH_STATES.AWAIT_TO_REWRITE_2FA_PASSWORD ||
                              currentTelegramAuthStep ===
                                TELEGRAM_AUTH_STATES.AWAIT_PASSWORD
                            ? "Submit Password"
                            : "Continue"}
                  </Button>
                )}

                {isConnected && (
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={handleReAuthClick}
                    startIcon={<FaExclamationTriangle />}
                  >
                    Re-authenticate
                  </Button>
                )}
              </Box>
            </>
          )}
        </Paper>
      </Box>

      {/* Re-auth destructive warning dialog */}
      <Dialog
        open={reAuthDialogOpen}
        onClose={() => setReAuthDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "warning.dark",
          }}
        >
          <FaExclamationTriangle style={{ color: "#ed6c02" }} />
          Destructive Action — Re-authenticate Telegram
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography fontWeight={600} mb={0.5}>
              Critical Warning
            </Typography>
            <Typography variant="body2">
              If you changed your phone number, re-authenticating will{" "}
              <strong>
                permanently disconnect all existing Telegram channels
              </strong>{" "}
              linked to your old number. Messages, groups, and automation tied
              to those channels will stop working and cannot be recovered
              automatically.
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Only proceed if you are sure you want to authenticate with a new
            phone number. If your phone number has not changed,
            re-authenticating is safe.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReAuthDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={confirmReAuth} variant="contained" color="error">
            Yes, Re-authenticate
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

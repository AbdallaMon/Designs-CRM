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
import { TELEGRAM_CONSTANTS } from "./constant";

const STEPS = ["Phone Number", "Verification Code", "Connected"];

const STEP_INDEX = {
  PHONE_NUMBER: 0,
  INIT: 0,
  AWAIT_CODE: 1,
  REQUIRE_PASSWORD: 1,
  AWAIT_TO_REWRITE_2FA_PASSWORD: 1,
  AWAIT_PASSWORD: 1,
  SUCCESS: 2,
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
    useState("INIT");
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
      if (req.data.status === "CONNECTED") {
        setCurrentTelegramAuthStep("SUCCESS");
      }
    }
  }

  function handleReAuthClick() {
    setReAuthDialogOpen(true);
  }

  function confirmReAuth() {
    setReAuthDialogOpen(false);
    setCurrentTelegramAuthStep("PHONE_NUMBER");
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
    console.log("Telegram auth response:", req);
    if (
      req?.message ===
      "The code you entered has expired. Please request a new code."
    ) {
      setCurrentTelegramAuthStep("INIT");
      return;
    }
    if (req?.message === "AUTH_KEY_UNREGISTERED") {
      setAuthError(
        "Incorrect password. The session key is invalid — please re-enter your password.",
      );
      setCurrentTelegramAuthStep("AWAIT_PASSWORD");
      setFormData((prev) => ({ ...prev, password: "" }));
      return;
    }
    if (req.status === 200) {
      setCurrentTelegramAuthStep(req.data.teleStatus);
    }
    if (req?.data?.teleStatus === "SUCCESS") {
      await getTelegramAuth();
    }
  }

  useEffect(() => {
    getTelegramAuth();
  }, []);

  const isConnected = currentTelegramAuthStep === "SUCCESS";
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
                      : currentTelegramAuthStep === "INIT" ||
                          currentTelegramAuthStep === "PHONE_NUMBER"
                        ? "Send Code"
                        : currentTelegramAuthStep === "AWAIT_CODE"
                          ? "Verify Code"
                          : currentTelegramAuthStep === "REQUIRE_PASSWORD" ||
                              currentTelegramAuthStep ===
                                "AWAIT_TO_REWRITE_2FA_PASSWORD" ||
                              currentTelegramAuthStep === "AWAIT_PASSWORD"
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

function RenderStepDescription({ currentTelegramAuthStep, authError }) {
  if (
    currentTelegramAuthStep === "PHONE_NUMBER" ||
    currentTelegramAuthStep === "INIT"
  ) {
    return (
      <Typography variant="body2" color="text.secondary">
        Enter the phone number linked to your Telegram account. Include your
        country code (e.g., +971 for UAE).
      </Typography>
    );
  }
  if (currentTelegramAuthStep === "AWAIT_CODE") {
    return (
      <Typography variant="body2" color="text.secondary">
        A verification code was sent to your Telegram app. Enter it below to
        continue.
      </Typography>
    );
  }
  if (currentTelegramAuthStep === "REQUIRE_PASSWORD") {
    return (
      <Typography variant="body2" color="text.secondary">
        Your account has two-step verification enabled. Enter your Telegram
        password to proceed.
      </Typography>
    );
  }
  if (currentTelegramAuthStep === "AWAIT_TO_REWRITE_2FA_PASSWORD") {
    return (
      <Alert severity="error" sx={{ py: 0.5 }}>
        Incorrect password. Please try again.
      </Alert>
    );
  }
  if (currentTelegramAuthStep === "AWAIT_PASSWORD") {
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
  if (currentTelegramAuthStep === "SUCCESS") {
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

function RenderTelegramAuthInput({
  currentTelegramAuthStep,
  formData,
  setFormData,
}) {
  if (
    currentTelegramAuthStep === "INIT" ||
    !currentTelegramAuthStep ||
    currentTelegramAuthStep === "PHONE_NUMBER"
  ) {
    return (
      <MuiTelInput
        defaultCountry="AE"
        value={formData.phoneNumber}
        onChange={(value) =>
          setFormData((prev) => ({ ...prev, phoneNumber: value }))
        }
        label="Phone Number"
        fullWidth
        error={
          formData.phoneNumber !== "" && !matchIsValidTel(formData.phoneNumber)
        }
        helperText={
          formData.phoneNumber !== "" && !matchIsValidTel(formData.phoneNumber)
            ? "Enter a valid phone number with country code"
            : "Format: +971 50 123 4567"
        }
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <FaMobileAlt style={{ color: "rgba(0,0,0,0.54)" }} />
            </InputAdornment>
          ),
        }}
      />
    );
  }
  if (currentTelegramAuthStep === "AWAIT_CODE") {
    return (
      <TextField
        label="Verification Code"
        value={formData.code}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, code: e.target.value }))
        }
        fullWidth
        inputProps={{ maxLength: 10, inputMode: "numeric" }}
        helperText="Check your Telegram app for the code"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <FaSms style={{ color: "rgba(0,0,0,0.54)" }} />
            </InputAdornment>
          ),
        }}
      />
    );
  }
  if (
    currentTelegramAuthStep === "REQUIRE_PASSWORD" ||
    currentTelegramAuthStep === "AWAIT_TO_REWRITE_2FA_PASSWORD" ||
    currentTelegramAuthStep === "AWAIT_PASSWORD"
  ) {
    return (
      <TextField
        label="Telegram Password"
        type="password"
        value={formData.password}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, password: e.target.value }))
        }
        fullWidth
        helperText="Your Telegram account password"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <FaLock style={{ color: "rgba(0,0,0,0.54)" }} />
            </InputAdornment>
          ),
        }}
      />
    );
  }
  return null;
}

function RenderCurrentTelegramAuthStep({ currentTelegramAuthStep }) {
  return null;
}

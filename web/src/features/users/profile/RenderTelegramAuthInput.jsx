"use client";

import { InputAdornment, TextField } from "@mui/material";
import { FaLock, FaMobileAlt, FaSms } from "react-icons/fa";
import { MuiTelInput, matchIsValidTel } from "mui-tel-input";
import { TELEGRAM_AUTH_STATES } from "@dms/shared";

export default function RenderTelegramAuthInput({
  currentTelegramAuthStep,
  formData,
  setFormData,
}) {
  if (
    currentTelegramAuthStep === TELEGRAM_AUTH_STATES.INIT ||
    !currentTelegramAuthStep ||
    currentTelegramAuthStep === TELEGRAM_AUTH_STATES.PHONE_NUMBER
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
  if (currentTelegramAuthStep === TELEGRAM_AUTH_STATES.AWAIT_CODE) {
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
    currentTelegramAuthStep === TELEGRAM_AUTH_STATES.REQUIRE_PASSWORD ||
    currentTelegramAuthStep ===
      TELEGRAM_AUTH_STATES.AWAIT_TO_REWRITE_2FA_PASSWORD ||
    currentTelegramAuthStep === TELEGRAM_AUTH_STATES.AWAIT_PASSWORD
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

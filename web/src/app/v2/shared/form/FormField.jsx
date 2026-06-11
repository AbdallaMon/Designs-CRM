"use client";
import { useState } from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

/**
 * A single form field built from scratch for v2.
 * Integrates with React Hook Form via `register` + `rules`.
 * Handles text, email, and password (with show/hide toggle).
 *
 * @param {{
 *   name: string,
 *   type?: "text" | "email" | "password",
 *   label: string,
 *   register: Function,
 *   rules?: object,
 *   error?: { message?: string },
 *   disabled?: boolean,
 * }} props
 */
export default function FormField({
  name,
  type = "text",
  label,
  register,
  rules = {},
  error,
  disabled = false,
  helperText,
  sx,
  variant = "filled",
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <TextField
      fullWidth
      label={label}
      type={resolvedType}
      variant="outlined"
      error={Boolean(error)}
      helperText={error?.message ? error.message : helperText || ""}
      disabled={disabled}
      autoComplete={
        type === "email"
          ? "email"
          : type === "password"
            ? "current-password"
            : "off"
      }
      {...register(name, rules)}
      sx={(theme) => ({
        backgroundColor:
          variant === "outlined" ? theme.palette.background.default : "inherit",
        width: "100%",
        ...(sx && sx),
      })}
      slotProps={{
        input: isPassword
          ? {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                  </IconButton>
                </InputAdornment>
              ),
            }
          : undefined
      }} />
  );
}

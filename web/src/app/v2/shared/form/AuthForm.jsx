"use client";
import { useForm } from "react-hook-form";
import { Box, Button, Stack } from "@mui/material";
import FormField from "@/app/v2/shared/form/FormField";

/**
 * Shared auth form for v2. Manages its own useForm instance.
 *
 * `fields`  — shape-only definitions: [{ id, name, type, label }]
 * `rules`   — validation rules per field name. Can be:
 *               - a plain object:  { email: emailRules, password: passwordRules }
 *               - a function:      (getValues) => ({ password: passwordRules, confirmPassword: confirmPasswordRules(getValues) })
 *             Use the function form when any rule needs access to sibling field values.
 * `onSubmit`      — called with RHF form data on valid submit
 * `submitLabel`   — text on the submit button (default: "Submit")
 * `children`      — optional slot rendered between fields and submit button
 *                   (e.g. a "Forgot password?" link)
 *
 * @param {{
 *   fields: Array<{ id: string, name: string, type: string, label: string }>,
 *   rules: Record<string, object> | ((getValues: Function) => Record<string, object>),
 *   onSubmit: (data: object) => void | Promise<void>,
 *   submitLabel?: string,
 *   children?: React.ReactNode,
 * }} props
 */
export default function AuthForm({
  fields,
  rules,
  onSubmit,
  submitLabel = "Submit",
  children,
}) {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onTouched" });

  const resolvedRules =
    typeof rules === "function" ? rules(getValues) : (rules ?? {});

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        {fields.map((field) => (
          <FormField
            key={field.id}
            name={field.name}
            type={field.type}
            label={field.label}
            register={register}
            rules={resolvedRules[field.name] ?? {}}
            error={errors[field.name]}
          />
        ))}

        {children}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isSubmitting}
          sx={{ py: 1.25 }}
        >
          {submitLabel}
        </Button>
      </Stack>
    </Box>
  );
}

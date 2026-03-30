"use client";
import AuthCard from "@/app/v2/shared/components/AuthCard";
import AuthForm from "@/app/v2/shared/form/AuthForm";
import { usePasswordReset } from "@/app/v2/module/auth/hooks/usePasswordReset";
import { RESET_PASSWORD_FIELDS } from "@/app/v2/module/auth/auth.constants";
import {
  passwordRules,
  confirmPasswordRules,
} from "@/app/v2/module/auth/auth.validation";

/**
 * @param {{ token: string }} props
 */
export default function ResetPasswordForm({ token }) {
  const { resetPassword } = usePasswordReset();
  return (
    <AuthCard title="Reset Password">
      <AuthForm
        fields={RESET_PASSWORD_FIELDS}
        rules={(getValues) => ({
          password: passwordRules,
          confirmPassword: confirmPasswordRules(getValues),
        })}
        onSubmit={(data) => resetPassword(data, token)}
        submitLabel="Reset Password"
      />
    </AuthCard>
  );
}

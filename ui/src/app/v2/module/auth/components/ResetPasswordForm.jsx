"use client";
import AuthCard from "@/app/v2/shared/components/AuthCard";
import AuthForm from "@/app/v2/shared/form/AuthForm";
import { RESET_PASSWORD_FIELDS } from "@/app/v2/module/auth/auth.constants";
import {
  passwordRules,
  confirmPasswordRules,
} from "@/app/v2/module/auth/auth.validation";
import { useAuthHooks } from "../hooks/useAuthHooks";

/**
 * @param {{ token: string }} props
 */
export default function ResetPasswordForm({ token }) {
  const { resetPassword } = useAuthHooks();
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

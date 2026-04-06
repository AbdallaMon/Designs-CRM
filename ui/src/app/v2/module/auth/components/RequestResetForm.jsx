"use client";
import Link from "next/link";
import AuthCard from "@/app/v2/shared/components/AuthCard";
import AuthForm from "@/app/v2/shared/form/AuthForm";
import { REQUEST_RESET_FIELDS } from "@/app/v2/module/auth/auth.constants";
import { emailRules } from "@/app/v2/module/auth/auth.validation";
import { useAuthHooks } from "../hooks/useAuthHooks";

const rules = { email: emailRules };

const subtitle = (
  <Link href="/login" style={{ color: "inherit" }}>
    Back to Login
  </Link>
);

export default function RequestResetForm() {
  const { requestReset } = useAuthHooks();

  return (
    <AuthCard title="Forgot Password" subtitle={subtitle}>
      <AuthForm
        fields={REQUEST_RESET_FIELDS}
        rules={rules}
        onSubmit={requestReset}
        submitLabel="Send Reset Email"
      />
    </AuthCard>
  );
}

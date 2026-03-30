"use client";
import Link from "next/link";
import { Button } from "@mui/material";
import AuthCard from "@/app/v2/shared/components/AuthCard";
import AuthForm from "@/app/v2/shared/form/AuthForm";
import { useLogin } from "@/app/v2/module/auth/hooks/useLogin";
import { LOGIN_FIELDS } from "@/app/v2/module/auth/auth.constants";
import {
  emailRules,
  passwordRules,
} from "@/app/v2/module/auth/auth.validation";

const rules = { email: emailRules, password: passwordRules };

export default function LoginForm() {
  const { login } = useLogin();

  return (
    <AuthCard title="Login">
      <AuthForm
        fields={LOGIN_FIELDS}
        rules={rules}
        onSubmit={login}
        submitLabel="Login"
      >
        <Button
          component={Link}
          href="/reset"
          color="secondary"
          size="small"
          sx={{ alignSelf: "flex-end", mt: -1 }}
        >
          Forgot password?
        </Button>
      </AuthForm>
    </AuthCard>
  );
}

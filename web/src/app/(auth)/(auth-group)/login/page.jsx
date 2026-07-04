"use client";
import Link from "next/link";
import { loginInputs } from "./data";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import AuthForm from "@/app/UiComponents/formComponents/forms/AuthForm";
import { Button, Typography } from "@mui/material";

export default function Page() {
  const { setLoading } = useToastContext();
  const { refetchMe } = useAuth();

  async function handleLogin(data) {
    const response = await handleRequestSubmit(
      data,
      setLoading,
      "auth/login",
      false,
      "Logging"
    );
    if (response.status === 200 || response?.success === true) {
      // The /auth/login response is the bare user (no permissions / navigationTabs /
      // profiles). Pull the full session from /auth/me so the dashboard drawer +
      // gating populate immediately — no manual refresh needed.
      await refetchMe();
    }
  }

  return (
    <>
      <AuthForm
        btnText={"Login"}
        inputs={loginInputs}
        formTitle={"Login"}
        onSubmit={handleLogin}
      >
        <Button component={Link} href={"/reset"} color="secondary">
          Forgot password ?
        </Button>
      </AuthForm>
    </>
  );
}

"use client";
import { use } from "react";
import { resetInputs, resetPasswordInputs } from "./data";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import AuthForm from "@/app/UiComponents/formComponents/forms/AuthForm";
import { Typography } from "@mui/material";

export default function ResetPage(props) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { setToastLoading } = useToastContext();
  const router = useRouter();

  async function handleReset(data) {
    try {
      if (!token) {
        // POST /v2 auth/request-password-reset — body { email }
        await handleRequestSubmit(
          { email: data.email },
          setToastLoading,
          "auth/reset",
          false,
          "Email is being reviewed"
        );
      } else {
        // POST /v2 auth/reset-password — body { password, confirmPassword, token }
        await handleRequestSubmit(
          { password: data.password, confirmPassword: data.confirmPassword, token },
          setToastLoading,
          `auth/reset/${token}`,
          false,
          "Resetting the password"
        );
        router.push("/login");
      }
    } catch (e) {
      console.log(e);
    }
  }

  const subTitle = (
    <Typography
      variant="body2"
      color="secondary"
      align="center"
      sx={{ mt: 1, mb: 2, fontWeight: 500 }}
      component={Link}
      href="/login"
    >
      Login?{" "}
    </Typography>
  );
  return (
    <>
      <AuthForm
        btnText={"Create"}
        inputs={token ? resetPasswordInputs : resetInputs}
        formTitle={"Create new password"}
        onSubmit={handleReset}
        subTitle={subTitle}
      />
    </>
  );
}

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
  const { setIsLoggedIn, setUser } = useAuth();

  async function handleLogin(data) {
    const response = await handleRequestSubmit(
      data,
      setLoading,
      "auth/login",
      false,
      "Logging"
    );
    if (response.status === 200) {
      setIsLoggedIn(true);
      setUser(response.user);
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

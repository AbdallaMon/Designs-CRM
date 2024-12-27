"use client";
import Link from "next/link";
import {loginInputs} from "./data";
import {useAuth} from "@/app/providers/AuthProvider";
import {useToastContext} from "@/app/providers/ToastLoadingProvider";
import {handleRequestSubmit} from "@/app/helpers/functions/handleSubmit";
import AuthForm from "@/app/UiComponents/formComponents/forms/AuthForm";
import {Button, Typography} from "@mui/material";

export default function Page() {
    const {setLoading} = useToastContext();
    const {setIsLoggedIn, setUser} = useAuth()

    async function handleLogin(data) {
        const response = await handleRequestSubmit(
              data,
              setLoading,
              "auth/login",
              false,
              "Logging",
        );
        if (response.status === 200) {
            setIsLoggedIn(true)
            setUser(response.user)
        }
    }

    const subTitle = (
          <Typography
                variant="body2"
                color="secondary"
                align="center"
                sx={{mt: 1, mb: 2, fontWeight: 500}}
                component={Link}
                href="/register"

          >
              انشاء حساب جديد؟
          </Typography>
    );

    return (
          <>
              <AuthForm
                    btnText={"Login"}
                    inputs={loginInputs}
                    formTitle={"Login"}
                    onSubmit={handleLogin}
              >
                  <Button component={Link} href={"/reset"} color="secondary">Forgot password ?</Button>
              </AuthForm>
          </>
    );
}

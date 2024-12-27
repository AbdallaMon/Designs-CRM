"use client";
import {resetInputs, resetPasswordInputs} from "./data";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useToastContext} from "@/app/providers/ToastLoadingProvider";
import {handleRequestSubmit} from "@/app/helpers/functions/handleSubmit";
import AuthForm from "@/app/UiComponents/formComponents/forms/AuthForm";
import {Typography} from "@mui/material";

export default function ResetPage({searchParams: {token}}) {
    const {setLoading} = useToastContext();
    const router = useRouter();

    async function handleReset(data) {
        try {
            await handleRequestSubmit(
                  data,
                  setLoading,
                  !token ? "auth/reset" : `auth/reset/${token}`,
                  false,
                  !token ? "Email is being reviewed" : "Resetting the password"
            );
            if (token) {
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
                sx={{mt: 1, mb: 2, fontWeight: 500}}
                component={Link}
                href="/login"
          >
              Login? </Typography>
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

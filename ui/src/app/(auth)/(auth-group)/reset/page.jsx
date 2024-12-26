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
                  !token ? "جاري مراجعة البريد الالكتروني" : "جاري اعادة انشاء كلمة السر",
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
              تسجيل الدخول؟ </Typography>
    );
    return (
          <>
              <AuthForm
                    btnText={"انشاء"}
                    inputs={token ? resetPasswordInputs : resetInputs}
                    formTitle={"انشاء كلمة سر جديدة"}
                    onSubmit={handleReset}
                    subTitle={subTitle}
              />
          </>
    );
}

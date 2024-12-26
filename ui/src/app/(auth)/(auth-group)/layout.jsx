"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/app/providers/AuthProvider";
import {Box} from "@mui/material";
import colors from "@/app/helpers/colors";

export default function HandleAuth({children}) {
    const {isLoggedIn} = useAuth()

    const router = useRouter();
    useEffect(() => {
        function handleRedirect() {
            const redirect = window.localStorage.getItem("redirect")
            if (isLoggedIn) {
                if (redirect && redirect.includes("dashboard")) {
                    window.localStorage.removeItem("redirect")
                    router.push(redirect)
                } else {
                    router.push("/dashboard")
                }
            }

        }

        handleRedirect()
    }, [isLoggedIn]);

    return (
          <>
              <Box sx={{
                  backgroundColor: colors.bgSecondary,

                  p: 1.5,
                  display: "flex",
                  minHeight: "100vh",
                  justifyContent: "center"
              }}>

                  {children}
              </Box>
          </>
    );
}

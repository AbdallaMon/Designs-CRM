"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { Box, Paper, Typography, useTheme, useMediaQuery } from "@mui/material";
import Image from "next/image";

export default function HandleAuth({ children }) {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const theme = useTheme();

    useEffect(() => {
        function handleRedirect() {
            const redirect = window.localStorage.getItem("redirect");
            if (isLoggedIn) {
                if (redirect && redirect.includes("dashboard")) {
                    window.localStorage.removeItem("redirect");
                    router.push(redirect);
                } else {
                    router.push("/dashboard");
                }
            }
        }

        handleRedirect();
    }, [isLoggedIn, router]);

    return (
          <Box
                sx={{
                    position: "relative",
                    minHeight: "100vh",
                    width: "100vw",
                    overflow: "hidden",
                }}
          >
              <Image
                    src="/admin-background.jpg"
                    alt="Admin Dashboard Background"
                    layout="fill"
                    objectFit="cover"
                    quality={100}
              />
              <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
              >

                      {children}

              </Box>
          </Box>
    );
}
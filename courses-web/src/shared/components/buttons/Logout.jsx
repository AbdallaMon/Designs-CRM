"use client";
import { Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useAuth } from "@/app/providers/AuthProvider";
import { FiLogOut } from "react-icons/fi";
import React from "react";

export default function Logout({ fit }) {
  const { setToastLoading } = useToastContext();
  const { setUser, setIsLoggedIn } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    const logout = await handleRequestSubmit(
      {},
      setToastLoading,
      `auth/logout`,
      false,
      "Logging out"
    );
    if (logout?.status === 200) {
      setIsLoggedIn(false);
      setUser(null);
      // Login lives on the lead site (web/); send the user there after logout.
      if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_WEB_URL) {
        window.location.href = `${process.env.NEXT_PUBLIC_WEB_URL}/login`;
      } else {
        router.push("/login");
      }
    }
  }

  return (
    <Button
      onClick={() => {
        handleLogout();
      }}
      sx={{
        width: fit ? "fit-content" : "100%",
        borderRadius: 2,
        textTransform: "none",
      }}
      color="error"
      variant="outlined"
      startIcon={<FiLogOut size={20} />}
    >
      Logout
    </Button>
  );
}

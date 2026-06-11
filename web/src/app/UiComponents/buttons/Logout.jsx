"use client";
import { Button } from "@mui/material";

import { useAuth } from "@/app/providers/AuthProvider";
import { FiLogOut } from "react-icons/fi";
import React from "react";

export default function Logout({ fit }) {
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
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

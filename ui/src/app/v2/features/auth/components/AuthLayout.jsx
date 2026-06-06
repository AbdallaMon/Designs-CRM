"use client";
import { Box } from "@mui/material";
import Image from "next/image";

/**
 * Full-page background wrapper for auth pages.
 * Renders a cover image with a dark overlay and centers its children.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function AuthLayout({ children }) {
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
        alt="Background"
        fill
        style={{ objectFit: "cover" }}
        quality={100}
        priority
      />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
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

"use client";

import React, { useEffect, useState } from "react";
import { Alert, Box, Collapse, Typography } from "@mui/material";
import { FaGoogle } from "react-icons/fa";
import { useSearchParams } from "next/navigation";

export default function GoogleRedirectStatus() {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  function resetSuccessStaus() {
    setSuccess(false);
    window.history.replaceState({}, "", window.location.pathname);
  }
  function resetErrorStatus() {
    setError(null);
    window.history.replaceState({}, "", window.location.pathname);
  }
  useEffect(() => {
    if (searchParams && searchParams.get("googleAuthSuccess") === "1") {
      setSuccess(true);
      // Auto-hide success after 5 seconds
      setTimeout(() => resetSuccessStaus(), 10000);
    }

    if (searchParams && searchParams.get("googleAuthError")) {
      setError(
        decodeURIComponent(searchParams.get("googleAuthError")).replace(
          /\+/g,
          " ",
        ),
      );
      // Auto-hide error after 8 seconds
      setTimeout(() => {
        resetErrorStatus();
      }, 8000);
    }
  }, [searchParams]);

  return (
    <>
      <Box sx={{}}>
        {/* Success Alert */}
        <Collapse in={success}>
          <Alert
            severity="success"
            icon={false}
            onClose={() => resetSuccessStaus()}
            sx={{
              width: "fit-content",
              background: "linear-gradient(135deg, #34a853 0%, #2d8e47 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 0,
              py: 2,
              position: "fixed",
              top: 0,
              zIndex: 1300,
              right: 0,
              px: 3,
              "& .MuiAlert-icon": {
                display: "none",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <FaGoogle size={24} color="#fff" />
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: "#fff",
                    mb: 0.5,
                  }}
                >
                  Google Calendar Connected Successfully!
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  Your calendar is now synced and ready to use
                </Typography>
              </Box>
            </Box>
          </Alert>
        </Collapse>

        {/* Error Alert */}
        <Collapse in={!!error}>
          <Alert
            severity="error"
            icon={false}
            onClose={() => resetErrorStatus()}
            sx={{
              width: "fit-content",
              background: "linear-gradient(135deg, #ea4335 0%, #d33b2c 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 0,
              py: 2,
              position: "fixed",
              top: 0,
              zIndex: 1300,
              right: 0,
              px: 3,
              "& .MuiAlert-icon": {
                display: "none",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <FaGoogle size={24} color="#fff" />
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: "#fff",
                    mb: 0.5,
                  }}
                >
                  Google Calendar Connection Failed
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  {error || "An error occurred while connecting"}
                </Typography>
              </Box>
            </Box>
          </Alert>
        </Collapse>
      </Box>
    </>
  );
}

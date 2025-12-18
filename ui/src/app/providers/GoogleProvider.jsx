"use client";
import { useEffect, useState } from "react";
import { getDataAndSet } from "../helpers/functions/getDataAndSet";
import {
  Alert,
  Button,
  Typography,
  Box,
  CircularProgress,
  Collapse,
} from "@mui/material";
import { FaGoogle, FaTimes } from "react-icons/fa";
import { useSearchParams } from "next/navigation";

export default function GoogleProvider({ children }) {
  const [connectionData, setConnectionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  useEffect(() => {
    async function connectGoogle() {
      const req = await getDataAndSet({
        url: "shared/calendar/google/connect",
        setData: setConnectionData,
        setLoading,
      });
      if (req && req.status === 200) {
        setShowAlert(!req.data?.isConnected);
      }
    }
    connectGoogle();
  }, []);
  useEffect(() => {
    if (searchParams && searchParams.get("googleAuthSuccess") === "1") {
      setShowAlert(false);
      setSuccess(true);
      // Auto-hide success after 5 seconds
      setTimeout(() => setSuccess(false), 10000);
    }
    console.log(
      searchParams.get("googleAuthError"),
      "searchParams.get(googleAuthError)"
    );
    if (searchParams && searchParams.get("googleAuthError")) {
      setError(
        decodeURIComponent(searchParams.get("googleAuthError")).replace(
          /\+/g,
          " "
        )
      );
      // Auto-hide error after 8 seconds
      setTimeout(() => setError(null), 8000);
    }
  }, [searchParams]);
  const handleConnect = () => {
    if (connectionData?.authUrl) {
      setIsConnecting(true);
      window.open(connectionData.authUrl, "_blank");
      setTimeout(() => setIsConnecting(false), 1000);
    }
  };
  console.log(error, "error");
  console.log(success, "success");
  return (
    <>
      <Box sx={{}}>
        {/* Success Alert */}
        <Collapse in={success}>
          <Alert
            severity="success"
            icon={false}
            onClose={() => setSuccess(false)}
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
              <Button
                size="small"
                onClick={() => setSuccess(false)}
                sx={{
                  minWidth: "auto",
                  color: "#fff",
                  "&:hover": {
                    background: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <FaTimes size={16} />
              </Button>
            </Box>
          </Alert>
        </Collapse>

        {/* Error Alert */}
        <Collapse in={!!error}>
          <Alert
            severity="error"
            icon={false}
            onClose={() => setError(null)}
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
              <Button
                size="small"
                onClick={() => setError(null)}
                sx={{
                  minWidth: "auto",
                  color: "#fff",
                  "&:hover": {
                    background: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <FaTimes size={16} />
              </Button>
            </Box>
          </Alert>
        </Collapse>

        {/* Connection Prompt Alert */}
        {showAlert && (
          <Alert
            severity="info"
            icon={false}
            sx={{
              width: "fit-content",
              background: "linear-gradient(135deg, #1a73e8 0%, #1557b0 100%)",
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
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}
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
                    Connect Your Google Calendar
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    Sync your calendar events and manage your schedule
                    seamlessly
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleConnect}
                  disabled={isConnecting || !connectionData?.authUrl}
                  sx={{
                    background: "#fff",
                    color: "#1a73e8",
                    textTransform: "none",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    "&:hover": {
                      background: "rgba(255,255,255,0.95)",
                    },
                    "&:disabled": {
                      background: "rgba(255,255,255,0.5)",
                      color: "rgba(26,115,232,0.5)",
                    },
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  {isConnecting ? (
                    <CircularProgress size={14} sx={{ color: "#1a73e8" }} />
                  ) : (
                    <FaGoogle size={12} />
                  )}
                  {isConnecting ? "Connecting..." : "Connect"}
                </Button>

                <Button
                  size="small"
                  onClick={() => setShowAlert(false)}
                  sx={{
                    minWidth: "auto",
                    color: "#fff",
                    "&:hover": {
                      background: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  <FaTimes size={16} />
                </Button>
              </Box>
            </Box>
          </Alert>
        )}
      </Box>

      {children}
    </>
  );
}

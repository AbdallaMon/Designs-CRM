"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import { FaCheckCircle, FaHome, FaTimesCircle } from "react-icons/fa";
import { useSearchParams } from "next/navigation";
import { getData } from "../helpers/functions/getData";

const translations = {
  en: {
    title: "Payment Successful!",
    redirectMessage: "You will be redirected to complete your registration in",
    seconds: "seconds",
    backHome: "Back to Home",
    loading: "Processing your payment...",
    errorTitle: "Payment Verification Issue",
    errorMessage: "We couldn't verify your payment. Please contact support.",
  },
  ar: {
    title: "تمت عملية الدفع بنجاح!",
    redirectMessage: "سيتم إعادة توجيهك لإكمال التسجيل خلال",
    seconds: "ثوانٍ",
    backHome: "العودة إلى الصفحة الرئيسية",
    loading: "جاري معالجة الدفع الخاص بك...",
    errorTitle: "مشكلة في التحقق من الدفع",
    errorMessage: "لم نتمكن من التحقق من الدفع الخاص بك. يرجى الاتصال بالدعم.",
  },
};

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("checking");
  const [redirectCountdown, setRedirectCountdown] = useState(2);
  const session_id = searchParams.get("session_id");
  const clientLeadId = searchParams.get("clientLeadId");

  const lng = searchParams.get("lng") || "ar";

  const content = translations[lng] || translations.ar;

  const direction = lng === "en" ? "ltr" : "rtl";

  useEffect(() => {
    if (session_id && clientLeadId) {
      const updatePaymentStatus = async () => {
        const request = await getData({
          url: `client/payment-status?sessionId=${session_id}&clientLeadId=${clientLeadId}&`,
          setLoading,
        });
        if (request && request.status === 200) {
          setStatus(request.paymentStatus);
          if (request.paymentStatus === "PAID") {
            const countdownInterval = setInterval(() => {
              setRedirectCountdown((prevCount) => {
                if (prevCount <= 1) {
                  clearInterval(countdownInterval);
                  window.location.href = `/register/complete?leadId=${clientLeadId}`;
                  return 0;
                }
                return prevCount - 1;
              });
            }, 1000);
          }
        }
      };

      updatePaymentStatus();
    }
  }, [session_id, clientLeadId]);

  if (loading) {
    return (
      <Container maxWidth="sm" dir={direction}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "70vh",
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>
            {content.loading}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" dir={direction}>
      <Paper
        elevation={3}
        sx={{
          mt: 5,
          mb: 5,
          p: 4,
          borderRadius: 2,
          textAlign: "center",
        }}
      >
        {status === "PAID" ? (
          // Success UI
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 4,
            }}
          >
            <FaCheckCircle
              style={{
                color: "#4caf50",
                fontSize: "64px",
                marginBottom: "16px",
              }}
            />
            <Typography variant="h4" component="h1" gutterBottom>
              {content.title}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mt: 3,
                fontWeight: "medium",
                color: "text.secondary",
              }}
            >
              {content.redirectMessage}
            </Typography>

            {/* Enhanced countdown display */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mt: 2,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: "primary.main",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "24px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                  animation: "pulse 1s infinite",
                  "@keyframes pulse": {
                    "0%": {
                      boxShadow: "0 0 0 0 rgba(25, 118, 210, 0.7)",
                    },
                    "70%": {
                      boxShadow: "0 0 0 10px rgba(25, 118, 210, 0)",
                    },
                    "100%": {
                      boxShadow: "0 0 0 0 rgba(25, 118, 210, 0)",
                    },
                  },
                }}
              >
                {redirectCountdown}
              </Box>
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontWeight: "medium",
              }}
            >
              {content.seconds}
            </Typography>
          </Box>
        ) : (
          // Error UI
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 4,
            }}
          >
            <FaTimesCircle
              style={{
                color: "#f44336",
                fontSize: "64px",
                marginBottom: "16px",
              }}
            />
            <Typography variant="h4" component="h1" gutterBottom>
              {content.errorTitle}
            </Typography>
            <Typography variant="body1" paragraph>
              {content.errorMessage}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

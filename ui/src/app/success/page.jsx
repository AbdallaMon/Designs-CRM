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
    message: "We have received your order and will contact you shortly.",
    backHome: "Back to Home",
    loading: "Processing your payment...",
    errorTitle: "Payment Verification Issue",
    errorMessage: "We couldn't verify your payment. Please contact support.",
  },
  ar: {
    title: "تمت عملية الدفع بنجاح!",
    message: "لقد استلمنا طلبك وسنتواصل معك قريباً.",
    backHome: "العودة إلى الصفحة الرئيسية",
    loading: "جاري معالجة الدفع الخاص بك...",
    errorTitle: "مشكلة في التحقق من الدفع",
    errorMessage: "لم نتمكن من التحقق من الدفع الخاص بك. يرجى الاتصال بالدعم.",
  },
};

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("cheking");
  const session_id = searchParams.get("session_id");
  const clientLeadId = searchParams.get("clientLeadId");

  const lng = searchParams.get("lng") || "ar";

  // Choose the appropriate language content
  const content = translations[lng] || translations.ar;

  // Set the direction based on language
  const direction = lng === "en" ? "ltr" : "rtl";

  useEffect(() => {
    if (session_id && clientLeadId) {
      // Send payment status to your API
      const updatePaymentStatus = async () => {
        const request = await getData({
          url: `client/payment-status?sessionId=${session_id}&clientLeadId=${clientLeadId}&`,
          setLoading,
        });
        if (request.status === 200) {
          setStatus(request.paymentStatus);
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
            <Typography variant="body1" paragraph>
              {content.message}
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

        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            href="/"
            component="a"
            startIcon={<FaHome />}
          >
            {content.backHome}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

"use client";
import { Box, Container, Typography, Paper, Button } from "@mui/material";
import { FaExclamationTriangle, FaHome } from "react-icons/fa";
import { useSearchParams } from "next/navigation";
import { PayButton } from "../UiComponents/client-page/new-register/CheckoutPage";

const translations = {
  en: {
    title: "Payment Cancelled",
    message: "Your payment was cancelled or not completed.",
    backHome: "Back to register page",
    tryAgain: "Try Payment Again",
    loading: "Loading...",
    note: "Note: You can complete your payment at any time.",
  },
  ar: {
    title: "تم إلغاء الدفع",
    message: "تم إلغاء الدفع الخاص بك أو لم يكتمل.",
    backHome: "العودة إلى صفحة التسجيل ",
    tryAgain: "حاول الدفع مرة أخرى",
    loading: "جاري التحميل...",
    note: "ملاحظة: يمكنك إكمال الدفع في أي وقت.",
  },
};

export default function CancelPage() {
  const searchParams = useSearchParams();

  const clientLeadId = searchParams.get("clientLeadId");
  const userId = searchParams.get("userId");
  const lng = searchParams.get("lng") || "ar";

  // Choose the appropriate language content
  const content = translations[lng] || translations.ar;

  // Set the direction based on language
  const direction = lng === "en" ? "ltr" : "rtl";

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
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 4,
          }}
        >
          <FaExclamationTriangle
            style={{ color: "#ff9800", fontSize: "64px", marginBottom: "16px" }}
          />
          <Typography variant="h4" component="h1" gutterBottom>
            {content.title}
          </Typography>
          <Typography variant="body1" paragraph>
            {content.message}
          </Typography>
          {/* <Typography variant="body2" color="text.secondary">
            {content.note}
          </Typography> */}
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            mt: 4,
            flexDirection: { xs: "column", sm: "row" },
            "& > *": { mb: { xs: 1, sm: 0 } },
          }}
        >
          <Button
            variant="outlined"
            size="large"
            component="a"
            href="/register"
            startIcon={<FaHome />}
          >
            {content.backHome}
          </Button>
          {clientLeadId && (
            <PayButton
              text={lng === "en" ? "Try again" : "اعادة محاولة الدفع"}
              clientLeadId={clientLeadId}
              userId={userId}
              lng={lng}
            />
          )}
        </Box>
      </Paper>
    </Container>
  );
}

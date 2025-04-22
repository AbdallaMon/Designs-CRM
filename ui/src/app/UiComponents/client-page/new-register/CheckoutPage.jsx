"use client";

import { useEffect } from "react";
import {
  Box,
  Typography,
  Zoom,
  useMediaQuery,
  useTheme,
  Grid2 as Grid,
  Button,
  CircularProgress,
} from "@mui/material";

import colors from "@/app/helpers/colors";
import { consultLevelsData, enConsultLevelsData } from "../consult-levels/data";
import { FaCreditCard } from "react-icons/fa";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

export function CheckoutPage({ lng, clientLead, test }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const data = lng === "ar" ? consultLevelsData : enConsultLevelsData;
  useEffect(() => {
    if (typeof window !== undefined)
      if (!clientLead || !clientLead?.id) {
        window.location.href = "/cancel";
      }
  }, [clientLead]);

  if (!clientLead || !clientLead?.id) return;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: { xs: "auto", md: "calc(100vh - 150px)" },
          maxHeight: { xs: "none", md: 800 },
          bgcolor: colors.bgSecondary,
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0px 5px 20px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 150px)",
        }}
      >
        <Box
          sx={{
            padding: { xs: 2, md: 3 },
            paddingBottom: { xs: 1.5, md: 2 },
            textAlign: "center",
            background: `linear-gradient(135deg, ${colors.primary}22, ${colors.bgSecondary})`,
            borderBottom: `1px solid ${colors.primary}33`,
          }}
        >
          <Typography
            variant="h3"
            fontSize={isMobile ? 22 : 28}
            fontWeight={700}
          >
            {data.title.firstLine}
            {data.title.secondLine && (
              <>
                <br />
                {data.title.secondLine}
              </>
            )}
          </Typography>
          <Typography
            variant="subtitle1"
            color={colors.secondaryText}
            fontSize={isMobile ? 18 : 22}
            fontWeight={600}
            sx={{ mt: 1 }}
          >
            {lng === "ar"
              ? "استشارة مع المهندس احمد نفسه"
              : "A Consultation with eng Ahmed him self"}
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: { xs: 1.5, sm: 3 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: 300,
              borderRadius: 2,
              p: 4,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <CircularProgress size={60} sx={{ mb: 3 }} />

              {/* English text */}
              <Typography variant="h5" fontWeight="bold">
                {lng === "ar"
                  ? "جاري التحويل الي صفحة الدفع..."
                  : "Redirecting to payment page..."}
              </Typography>
            </Box>
          </Box>

          {/* <Box
            sx={{
              position: "relative",
              width: "100%",
              paddingTop: { xs: "177.78%", sm: "56.25%" }, // 16:9 aspect ratio for desktop, 9:16 for mobile
              margin: "0 auto",
              maxWidth: { xs: "100%", sm: 560 }, // Limit width on larger screens
            }}
          >
            <iframe
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                borderRadius: "8px",
                border: "none",
              }}
              src="https://www.youtube.com/embed/n7uwPCkOv28"
              title="YouTube Shorts video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </Box>
          <Box sx={{ height: { xs: 40, md: 80 } }} /> */}
        </Box>

        <Zoom in={true} timeout={500}>
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              borderTop: `1px solid ${colors.primary}33`,
              backgroundColor: "white",
              boxShadow: "0px -2px 10px rgba(0, 0, 0, 0.08)",
              position: "relative",
              zIndex: 10,
            }}
          >
            <PaymentSection
              payment={data.paymentData}
              lng={lng}
              clientLead={clientLead}
              test={test}
            />
          </Box>
        </Zoom>
      </Box>
    </>
  );
}

function PaymentSection({ payment, clientLead, lng, test }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "column" },
        alignItems: { xs: "stretch", sm: "center" },
        justifyContent: "center",
        gap: 2,
      }}
    >
      <PayButton
        text={payment.button}
        clientLeadId={clientLead.id}
        clientId={clientLead.clientId}
        lng={lng}
        pay={true}
        test={test}
      />
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="body1"
          fontWeight={500}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          {payment.description}
        </Typography>
      </Box>
    </Box>
  );
}

export function PayButton({
  text = "Pay",
  clientLeadId,
  clientId,
  lng = "ar",
  pay,
  test,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { setLoading } = useToastContext();
  const handlePayment = async () => {
    const data = await handleRequestSubmit(
      { clientLeadId, clientId, lng, test },
      setLoading,
      `client/pay`,
      false,
      "Redirecting..."
    );
    if (data.url) {
      window.location.href = data.url;
    }
  };
  useEffect(() => {
    if (lng && clientLeadId && pay) {
      handlePayment();
    }
  }, [lng, clientLeadId]);
  if (pay) {
    return <></>;
  }
  return (
    <Button
      size={isMobile ? "large" : "medium"}
      sx={{
        px: { xs: 3, sm: 4 },
        py: { xs: 1.5, sm: 1 },
        borderRadius: 2,
        bgcolor: colors.primary,
        color: "white",
        width: { xs: "100%", sm: "auto" }, // Full width on mobile
        transition: "all 0.3s ease",
        "&:hover": {
          bgcolor: colors.primary + "dd",
          transform: "translateY(-3px)",
          boxShadow: `0 4px 8px rgba(0, 0, 0, 0.2)`,
        },
        "&:active": {
          transform: "translateY(0)",
        },
      }}
      variant="contained"
      onClick={handlePayment}
      startIcon={<FaCreditCard />}
    >
      {text}
    </Button>
  );
}

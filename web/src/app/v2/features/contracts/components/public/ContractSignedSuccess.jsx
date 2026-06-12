"use client";

// PUBLIC e-sign — the success view (status === "REGISTERED"). Ported from the legacy
// `client/ContractSignedSuccessSection.jsx`, SINGLE-LANGUAGE Arabic. The PDF links come from
// the session (pdfLinkAr / pdfLinkEn) produced by the frozen server-side PDF builder.

import { Box, Card, CardContent, Button, Typography, Stack, useTheme, alpha } from "@mui/material";
import { MdCheckCircle, MdFileDownload } from "react-icons/md";

export default function ContractSignedSuccess({ pdfAr, pdfEn }) {
  const theme = useTheme();
  const showBoth = Boolean(pdfAr && pdfEn);
  const hasAny = Boolean(pdfAr || pdfEn);

  return (
    <Box dir="rtl" sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100%", p: 2 }}>
      <Card
        elevation={0}
        sx={{ maxWidth: 560, width: "100%", borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, bgcolor: theme.palette.background.paper }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={3} alignItems="center">
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: "50%", bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
              <MdCheckCircle size={40} />
            </Box>
            <Stack spacing={1} alignItems="center" textAlign="center">
              <Typography variant="h5" fontWeight={600} color="text.primary">تم توقيع العقد بنجاح</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                شكرًا لتعاونك. يمكنك تنزيل نسخة العقد بصيغة PDF.
              </Typography>
            </Stack>
            <Stack direction={showBoth ? "column" : "row"} spacing={1.5} sx={{ width: "100%", mt: 2 }}>
              {!hasAny && (
                <Typography variant="body2" color="warning.main" textAlign="center">
                  لا يوجد رابط متاح لتنزيل العقد حاليًا.
                </Typography>
              )}
              {pdfAr && (
                <Button component="a" href={pdfAr} target="_blank" rel="noopener noreferrer" variant="contained" startIcon={<MdFileDownload />} fullWidth sx={{ py: 1.25, fontWeight: 500 }}>
                  تحميل العقد (عربي)
                </Button>
              )}
              {pdfEn && (
                <Button component="a" href={pdfEn} target="_blank" rel="noopener noreferrer" variant={showBoth ? "outlined" : "contained"} startIcon={<MdFileDownload />} fullWidth sx={{ py: 1.25, fontWeight: 500 }}>
                  تحميل العقد (إنجليزي)
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

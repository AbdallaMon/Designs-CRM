// app/UiComponents/contract/ContractSignedSuccessSection.jsx
"use client";

import { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Stack,
  useTheme,
  alpha,
} from "@mui/material";
import { MdCheckCircle, MdFileDownload } from "react-icons/md";

export default function ContractSignedSuccessSection({
  lng = "en",
  pdfAr,
  pdfEn,
  onClose,
}) {
  const theme = useTheme();
  const isAr = lng === "ar";

  const T = useMemo(
    () => ({
      title: isAr ? "تم توقيع العقد بنجاح" : "Contract Signed Successfully",
      sub: isAr
        ? "شكرًا لتعاونك. يمكنك تنزيل نسخة العقد بصيغة PDF."
        : "Thank you! You can download your contract PDF below.",
      btnAr: isAr ? "تحميل العقد (عربي)" : "Download PDF (AR)",
      btnEn: isAr ? "تحميل العقد (إنجليزي)" : "Download PDF (EN)",
      noPdf: isAr
        ? "لا يوجد رابط متاح لتنزيل العقد حاليًا."
        : "No PDF link is available right now.",
      done: isAr ? "تم" : "Done",
    }),
    [isAr]
  );

  const showBoth = Boolean(pdfAr && pdfEn);
  const hasAny = Boolean(pdfAr || pdfEn);

  return (
    <Box
      dir={isAr ? "rtl" : "ltr"}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100%",
        p: 2,
      }}
    >
      <Card
        elevation={0}
        sx={{
          maxWidth: 560,
          width: "100%",
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 72,
                height: 72,
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
              }}
            >
              <MdCheckCircle size={40} />
            </Box>

            <Stack spacing={1} alignItems="center" textAlign="center">
              <Typography variant="h5" fontWeight={600} color="text.primary">
                {T.title}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 400 }}
              >
                {T.sub}
              </Typography>
            </Stack>

            <Stack
              direction={showBoth ? "column" : "row"}
              spacing={1.5}
              sx={{ width: "100%", mt: 2 }}
            >
              {!hasAny && (
                <Typography
                  variant="body2"
                  color="warning.main"
                  textAlign="center"
                >
                  {T.noPdf}
                </Typography>
              )}

              {pdfAr && (
                <Button
                  component="a"
                  href={pdfAr}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  startIcon={<MdFileDownload />}
                  fullWidth
                  sx={{
                    py: 1.25,
                    textTransform: "none",
                    fontWeight: 500,
                  }}
                >
                  {T.btnAr}
                </Button>
              )}

              {pdfEn && (
                <Button
                  component="a"
                  href={pdfEn}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant={showBoth ? "outlined" : "contained"}
                  startIcon={<MdFileDownload />}
                  fullWidth
                  sx={{
                    py: 1.25,
                    textTransform: "none",
                    fontWeight: 500,
                  }}
                >
                  {T.btnEn}
                </Button>
              )}
            </Stack>

            {onClose && (
              <Button
                onClick={onClose}
                sx={{
                  mt: 1,
                  textTransform: "none",
                  color: "text.secondary",
                }}
              >
                {T.done}
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

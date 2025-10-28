// app/UiComponents/contract/ContractSignedSuccessSection.jsx
"use client";

import { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Divider,
  Stack,
} from "@mui/material";
import { MdCheckCircle, MdFileDownload } from "react-icons/md";

export default function ContractSignedSuccessSection({
  lng = "en",
  pdfAr, // string | undefined  -> Arabic PDF link
  pdfEn, // string | undefined  -> English PDF link
  onClose, // optional: callback after download or to go back/home
}) {
  const isAr = lng === "ar";

  const T = useMemo(
    () => ({
      title: isAr ? "تم توقيع العقد بنجاح" : "Contract signed successfully",
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
    <Box dir={isAr ? "rtl" : "ltr"} sx={{ px: 2 }}>
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ py: 4 }}>
          <Stack
            direction="column"
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{ textAlign: "center" }}
          >
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 84,
                height: 84,
                borderRadius: "50%",
                bgcolor: (t) => t.palette.success.light,
              }}
            >
              <MdCheckCircle size={56} color="currentColor" />
            </Box>

            <Typography variant="h5" fontWeight={700}>
              {T.title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 560 }}
            >
              {T.sub}
            </Typography>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack
            direction={isAr ? "row-reverse" : "row"}
            spacing={2}
            alignItems="center"
            justifyContent="center"
            sx={{ flexWrap: "wrap" }}
          >
            {!hasAny && (
              <Typography variant="body2" color="warning.main">
                {T.noPdf}
              </Typography>
            )}

            {pdfAr && (
              <Button
                component="a"
                href={pdfAr}
                target="_blank"
                rel="noopener noreferrer"
                variant={showBoth ? "contained" : "contained"}
                startIcon={<MdFileDownload />}
                sx={{ minWidth: 220 }}
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
                sx={{ minWidth: 220 }}
              >
                {T.btnEn}
              </Button>
            )}
          </Stack>
        </CardContent>

        <CardActions sx={{ justifyContent: "center", pb: 3 }}>
          {onClose && <Button onClick={onClose}>{T.done}</Button>}
        </CardActions>
      </Card>
    </Box>
  );
}

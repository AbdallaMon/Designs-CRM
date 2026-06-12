"use client";

// PUBLIC e-sign — the signature step (status === "SIGNING"). Ported from the legacy
// `client/ContractSignature.jsx` but SINGLE-LANGUAGE Arabic and wired to the v2 data layer.
//
// Flow preserved 1:1:
//   • Two methods: draw online (SignatureCanvas) OR upload+crop an image (5:2, 1000×400 PNG).
//   • The signature image is uploaded via the v2 CLIENT chunk upload (useUpload({ isClient:true })
//     → POST /v2/files/client/chunks) which returns a RELATIVE `/uploads/<uuid>.png` path.
//   • That path is submitted as `signatureUrl` to POST /v2/client/contracts/generate-pdf
//     (§5c: signatureUrl MUST be a relative upload path — the BE SSRF-locks it). The body
//     matches the BE .strict(): { sessionData:{ arToken }, signatureUrl, lng }. The session is
//     selected EXCLUSIVELY by the token (no client id). On success the parent refetches and the
//     status advances to REGISTERED server-side.

import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  Paper,
  Alert,
  Divider,
} from "@mui/material";
import SignatureCanvas from "react-signature-canvas";
import { useUpload } from "@/app/v2/hooks/useUpload";
import { useOverlay } from "@/app/v2/hooks/useOverlay";
import contractsService from "../../contracts.service.js";
import { runContractMutation } from "../../contracts.mutations.js";

// ===== Signature image processing constants (preserved from legacy)
const TARGET_RATIO_W = 5;
const TARGET_RATIO_H = 2;
const TARGET_RATIO = TARGET_RATIO_W / TARGET_RATIO_H;
const TARGET_WIDTH = 1000;
const TARGET_HEIGHT = Math.round(TARGET_WIDTH / TARGET_RATIO);

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

const blobFromCanvas = (canvas) =>
  new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));

const cropToAspect = (img, outW, outH) => {
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  const srcW = img.width;
  const srcH = img.height;
  const srcRatio = srcW / srcH;
  let cropW, cropH, sx, sy;
  if (srcRatio > TARGET_RATIO) {
    cropH = srcH;
    cropW = Math.round(cropH * TARGET_RATIO);
    sx = Math.round((srcW - cropW) / 2);
    sy = 0;
  } else {
    cropW = srcW;
    cropH = Math.round(cropW / TARGET_RATIO);
    sx = 0;
    sy = Math.round((srcH - cropH) / 2);
  }
  ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, outW, outH);
  return canvas;
};

export default function ContractSignature({ session, token, onSignatureSaved, handleBack, disabled }) {
  const sigCanvas = useRef({});
  const overlay = useOverlay();
  // Client chunk upload → returns a relative /uploads/... path (signatureUrl).
  const { uploadAsChunk } = useUpload({
    isClient: true,
    onUploadStart: () => overlay.open?.(),
    onUploadEnd: () => overlay.close?.(),
  });

  const [method, setMethod] = useState("online"); // online | image
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // image-method state
  const [sigImageFile, setSigImageFile] = useState(null);
  const [processedPreview, setProcessedPreview] = useState(null);
  const [processedBlob, setProcessedBlob] = useState(null);
  const [ratioInfo, setRatioInfo] = useState("");
  const hasProcessed = !!processedBlob;

  const arToken = session?.arToken || token;

  // Submit the resolved upload path to /generate-pdf (token-authoritative). signatureUrl is
  // the RELATIVE /uploads/... path the BE expects + SSRF-validates.
  async function finalize(signatureUrl) {
    if (!signatureUrl) {
      setError("فشل رفع التوقيع.");
      return;
    }
    setSubmitting(true);
    const res = await runContractMutation(
      () => contractsService.generatePdf({ arToken, signatureUrl, lng: "ar" }),
      { loading: "جاري اعتماد العقد..." },
    );
    setSubmitting(false);
    if (res) onSignatureSaved?.();
  }

  // ── online draw ──────────────────────────────────────────────────────────────────
  const handleClearCanvas = () => sigCanvas.current?.clear?.();

  const getSignatureAsFile = async () => {
    if (!sigCanvas.current) return null;
    const canvas = sigCanvas.current.getCanvas();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    return new File([blob], `signature-${token || "custom"}.png`, { type: "image/png" });
  };

  const handleOnlineSave = async () => {
    setError("");
    if (sigCanvas.current?.isEmpty?.()) {
      setError("يرجى التوقيع قبل الحفظ.");
      return;
    }
    const file = await getSignatureAsFile();
    if (!file) {
      setError("تعذر قراءة التوقيع.");
      return;
    }
    const res = await uploadAsChunk({ file });
    await finalize(res?.url);
  };

  // ── image upload + crop ────────────────────────────────────────────────────────────
  const setFileAndAutoPreview = async (f) => {
    if (processedPreview) URL.revokeObjectURL(processedPreview);
    setProcessedPreview(null);
    setProcessedBlob(null);
    setRatioInfo("");
    setError("");
    setSigImageFile(f);
    if (!f) return;
    try {
      const img = await loadImage(f);
      setRatioInfo(`${(img.width / img.height).toFixed(3)} (w:${img.width}, h:${img.height})`);
      const canvas = cropToAspect(img, TARGET_WIDTH, TARGET_HEIGHT);
      const blob = await blobFromCanvas(canvas);
      setProcessedBlob(blob);
      setProcessedPreview(URL.createObjectURL(blob));
    } catch {
      setError("خطأ أثناء معالجة الصورة. جرّب صورة أخرى أو قصّها بشكل أوضح.");
    }
  };

  const handleImageConfirmUpload = async () => {
    setError("");
    if (!processedBlob) {
      setError("لا توجد معاينة جاهزة.");
      return;
    }
    const file = new File([processedBlob], `signature-only-${token || "custom"}.png`, { type: "image/png" });
    const res = await uploadAsChunk({ file });
    await finalize(res?.url);
  };

  const busy = disabled || submitting;

  return (
    <Box sx={{ px: 1 }} dir="rtl">
      <Box sx={{ px: 2, pt: 1 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>اختر طريقة التوقيع</Typography>
        <RadioGroup row value={method} onChange={(e) => setMethod(e.target.value)} name="signature-method">
          <FormControlLabel value="online" control={<Radio />} label="توقيع إلكتروني" />
          <FormControlLabel value="image" control={<Radio />} label="رفع صورة توقيع (مقصوصة)" />
        </RadioGroup>
        <Divider sx={{ mt: 1 }} />
      </Box>

      {error && <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>}

      {method === "online" && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography sx={{ mb: 1 }} variant="h6">ارسم توقيعك</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 2, width: "100%", maxWidth: 800, mx: "auto", borderRadius: 1 }}>
            <SignatureCanvas
              penColor="black"
              canvasProps={{
                width: typeof window !== "undefined" && window.innerWidth > 600 ? 600 : typeof window !== "undefined" ? window.innerWidth - 40 : 320,
                height: 200,
                style: { border: "1px solid", borderColor: "inherit" },
              }}
              ref={sigCanvas}
              clearOnResize={false}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 2, width: "100%" }}>
              <Button variant="outlined" onClick={handleBack} disabled={busy}>رجوع</Button>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="outlined" onClick={handleClearCanvas} disabled={busy}>مسح</Button>
              <Button onClick={handleOnlineSave} variant="contained" disabled={busy}>حفظ</Button>
            </Stack>
          </Box>
        </Paper>
      )}

      {method === "image" && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>رفع صورة التوقيع فقط</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            رجاءً قص الصورة بحيث تحتوي على التوقيع فقط بدون خلفية زائدة. يفضّل نسبة 5:2. ستظهر المعاينة تلقائيًا بعد اختيار الصورة.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Button variant="outlined" component="label" disabled={busy}>
              اختر صورة
              <input type="file" hidden accept="image/*" onChange={(e) => setFileAndAutoPreview(e.target.files?.[0] || null)} />
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
              {sigImageFile ? `الصورة المختارة: ${sigImageFile.name}` : "لم يتم اختيار صورة"}
            </Typography>
            <Button variant="contained" disabled={!hasProcessed || busy} onClick={handleImageConfirmUpload}>تأكيد الرفع</Button>
          </Stack>
          {ratioInfo ? (
            <Typography variant="caption" sx={{ mt: 1, display: "block" }}>نسبة أبعاد الصورة: {ratioInfo}</Typography>
          ) : null}
          {processedPreview && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">المعاينة</Typography>
              <Box component="img" src={processedPreview} alt="signature preview" sx={{ mt: 1, width: "100%", maxWidth: 500, borderRadius: 1, border: "1px solid", borderColor: "divider" }} />
              <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                سيتم الحفظ بالمقاس {TARGET_WIDTH}×{TARGET_HEIGHT} بكسل (PNG)
              </Typography>
            </Box>
          )}
          <Stack direction="row" sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={handleBack} disabled={busy}>رجوع</Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}

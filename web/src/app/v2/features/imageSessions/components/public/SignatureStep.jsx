"use client";

// Public-wizard SIGNATURE + PDF step (SURFACE 3, status === "SELECTED_IMAGES"). Mirrors the
// contracts public ContractSignature: draw online OR upload+crop a 5:2 PNG, upload it via the
// CLIENT chunk upload (→ relative /uploads/<uuid>.png — the BE SSRF-locks signatureUrl), then
// POST /generate-pdf with the body shape the service/BE expect:
//   generatePdf({ sessionData: session, signatureUrl, sessionStatus: nextStatus })
// 🔒 the PDF builder is FROZEN + synchronous, so we show a BLOCKING "جارٍ إنشاء الملف…" overlay
// (not a frozen button) while it runs. On success the parent refetches → SuccessState. RTL.

import { useRef, useState } from "react";
import {
  Alert, Backdrop, Box, Button, CircularProgress, Divider, FormControlLabel, Paper, Radio,
  RadioGroup, Stack, Typography,
} from "@mui/material";
import SignatureCanvas from "react-signature-canvas";
import { useUpload } from "@/app/v2/hooks/useUpload";
import { SectionCard } from "@/app/v2/shared/components";
import imageSessionsService from "../../imageSessions.service.js";
import { runImageSessionMutation } from "../../imageSessions.mutations.js";

// Signature image processing constants (preserved from the contracts pattern).
const TARGET_RATIO = 5 / 2;
const TARGET_WIDTH = 1000;
const TARGET_HEIGHT = Math.round(TARGET_WIDTH / TARGET_RATIO);

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

const blobFromCanvas = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));

const cropToAspect = (img, outW, outH) => {
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  const srcRatio = img.width / img.height;
  let cropW, cropH, sx, sy;
  if (srcRatio > TARGET_RATIO) {
    cropH = img.height;
    cropW = Math.round(cropH * TARGET_RATIO);
    sx = Math.round((img.width - cropW) / 2);
    sy = 0;
  } else {
    cropW = img.width;
    cropH = Math.round(cropW / TARGET_RATIO);
    sx = 0;
    sy = Math.round((img.height - cropH) / 2);
  }
  ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, outW, outH);
  return canvas;
};

export function SignatureStep({ session, token, nextStatus, onBack, onUpdate, disabled }) {
  const sigCanvas = useRef({});
  const { uploadAsChunk } = useUpload({ isClient: true });

  const [method, setMethod] = useState("online"); // online | image
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false); // upload phase
  const [generating, setGenerating] = useState(false); // FROZEN PDF phase (blocking)

  const [sigImageFile, setSigImageFile] = useState(null);
  const [processedPreview, setProcessedPreview] = useState(null);
  const [processedBlob, setProcessedBlob] = useState(null);

  const busy = disabled || submitting || generating;

  // Submit the resolved upload path to /generate-pdf (token-authoritative, FROZEN builder).
  async function finalize(signatureUrl) {
    if (!signatureUrl) {
      setError("فشل رفع التوقيع.");
      return;
    }
    setGenerating(true);
    const res = await runImageSessionMutation(
      () =>
        imageSessionsService.generatePdf({
          sessionData: session,
          signatureUrl,
          sessionStatus: nextStatus,
        }),
      { loading: "جارٍ إنشاء الملف…", setLoading: setGenerating },
    );
    if (res) await onUpdate?.();
  }

  // ── online draw ──────────────────────────────────────────────────────────────────────
  const getSignatureAsFile = async () => {
    if (!sigCanvas.current) return null;
    const canvas = sigCanvas.current.getCanvas();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    return new File([blob], `signature-${token || "session"}.png`, { type: "image/png" });
  };

  const handleOnlineSave = async () => {
    setError("");
    if (sigCanvas.current?.isEmpty?.()) {
      setError("يرجى التوقيع قبل الحفظ.");
      return;
    }
    setSubmitting(true);
    const file = await getSignatureAsFile();
    const res = file ? await uploadAsChunk({ file }) : null;
    setSubmitting(false);
    await finalize(res?.url);
  };

  // ── image upload + crop ────────────────────────────────────────────────────────────────
  const setFileAndAutoPreview = async (f) => {
    if (processedPreview) URL.revokeObjectURL(processedPreview);
    setProcessedPreview(null);
    setProcessedBlob(null);
    setError("");
    setSigImageFile(f);
    if (!f) return;
    try {
      const img = await loadImage(f);
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
    setSubmitting(true);
    const file = new File([processedBlob], `signature-${token || "session"}.png`, { type: "image/png" });
    const res = await uploadAsChunk({ file });
    setSubmitting(false);
    await finalize(res?.url);
  };

  return (
    <SectionCard title="التوقيع واعتماد الاختيارات">
      <Backdrop open={generating} sx={{ zIndex: (t) => t.zIndex.modal + 1, color: "#fff", flexDirection: "column", gap: 2 }}>
        <CircularProgress color="inherit" />
        <Typography>جارٍ إنشاء الملف…</Typography>
      </Backdrop>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>اختر طريقة التوقيع</Typography>
      <RadioGroup row value={method} onChange={(e) => setMethod(e.target.value)} name="signature-method">
        <FormControlLabel value="online" control={<Radio />} label="توقيع إلكتروني" />
        <FormControlLabel value="image" control={<Radio />} label="رفع صورة توقيع" />
      </RadioGroup>
      <Divider sx={{ my: 1 }} />

      {error && <Alert severity="warning" sx={{ my: 2 }}>{error}</Alert>}

      {method === "online" ? (
        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
          <Typography sx={{ mb: 1 }} variant="h6">ارسم توقيعك</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <SignatureCanvas
              penColor="black"
              canvasProps={{
                width: typeof window !== "undefined" && window.innerWidth > 600 ? 560 : typeof window !== "undefined" ? window.innerWidth - 60 : 320,
                height: 200,
                style: { border: "1px solid", borderColor: "inherit", borderRadius: 4 },
              }}
              ref={sigCanvas}
              clearOnResize={false}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 2, width: "100%" }}>
              <Button variant="outlined" onClick={onBack} disabled={busy}>رجوع</Button>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="outlined" onClick={() => sigCanvas.current?.clear?.()} disabled={busy}>مسح</Button>
              <Button variant="contained" onClick={handleOnlineSave} disabled={busy}>اعتماد</Button>
            </Stack>
          </Box>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>رفع صورة التوقيع</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            رجاءً قص الصورة بحيث تحتوي على التوقيع فقط. ستظهر المعاينة تلقائيًا بعد اختيار الصورة.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Button variant="outlined" component="label" disabled={busy}>
              اختر صورة
              <input type="file" hidden accept="image/*" onChange={(e) => setFileAndAutoPreview(e.target.files?.[0] || null)} />
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
              {sigImageFile ? sigImageFile.name : "لم يتم اختيار صورة"}
            </Typography>
            <Button variant="contained" disabled={!processedBlob || busy} onClick={handleImageConfirmUpload}>اعتماد</Button>
          </Stack>
          {processedPreview && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">المعاينة</Typography>
              <Box component="img" src={processedPreview} alt="signature preview" sx={{ mt: 1, width: "100%", maxWidth: 400, borderRadius: 1, border: "1px solid", borderColor: "divider" }} />
            </Box>
          )}
          <Stack direction="row" sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={onBack} disabled={busy}>رجوع</Button>
          </Stack>
        </Paper>
      )}
    </SectionCard>
  );
}

export default SignatureStep;

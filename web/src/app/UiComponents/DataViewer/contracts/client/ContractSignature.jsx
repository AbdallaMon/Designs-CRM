// ContractSignature.jsx
"use client";

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
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { FloatingActionButton } from "../../image-session/client-session/Utility";

// ===== Signature image processing constants
const TARGET_RATIO_W = 5;
const TARGET_RATIO_H = 2;
const TARGET_RATIO = TARGET_RATIO_W / TARGET_RATIO_H;
const TARGET_WIDTH = 1000; // px
const TARGET_HEIGHT = Math.round(TARGET_WIDTH / TARGET_RATIO);

// ---------- helpers ----------
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
    // too wide -> crop left/right
    cropH = srcH;
    cropW = Math.round(cropH * TARGET_RATIO);
    sx = Math.round((srcW - cropW) / 2);
    sy = 0;
  } else {
    // too tall -> crop top/bottom
    cropW = srcW;
    cropH = Math.round(cropW / TARGET_RATIO);
    sx = 0;
    sy = Math.round((srcH - cropH) / 2);
  }

  ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, outW, outH);
  return canvas;
};

// ---------- UI subcomponents ----------
const MethodSelector = ({ method, onChange, lng }) => (
  <Box sx={{ px: 2, pt: 1 }}>
    <Typography variant="subtitle1" sx={{ mb: 1 }}>
      {lng === "ar" ? "اختر طريقة التوقيع" : "Choose a signing method"}
    </Typography>
    <RadioGroup
      row
      value={method}
      onChange={(e) => onChange(e.target.value)}
      name="signature-method"
    >
      <FormControlLabel
        value="online"
        control={<Radio />}
        label={lng === "ar" ? "توقيع إلكتروني" : "Sign online"}
      />
      <FormControlLabel
        value="image"
        control={<Radio />}
        label={
          lng === "ar"
            ? "رفع صورة توقيع (مقصوصة)"
            : "Upload signature image (cropped)"
        }
      />
    </RadioGroup>
    <Divider sx={{ mt: 1 }} />
  </Box>
);

const OnlineSignPanel = ({
  lng,
  sigCanvas,
  disabled,
  onClear,
  onSave,
  handleBack,
}) => (
  <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
    <Typography sx={{ mb: 1 }} variant="h6">
      {lng === "ar" ? "ارسم توقيعك" : "Draw Your Signature"}
    </Typography>

    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        width: "100%",
        maxWidth: 800,
        mx: "auto",
        borderRadius: 1,
      }}
    >
      <SignatureCanvas
        penColor="black"
        canvasProps={{
          width:
            typeof window !== "undefined" && window.innerWidth > 600
              ? 600
              : typeof window !== "undefined"
              ? window.innerWidth - 40
              : 320,
          height: 200,
          style: { border: "1px solid", borderColor: "inherit" },
        }}
        ref={sigCanvas}
        clearOnResize={false}
      />

      <Stack direction="row" spacing={1} sx={{ mt: 2, width: "100%" }}>
        <FloatingActionButton
          disabled={disabled}
          handleClick={handleBack}
          type="BACK"
        />
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="outlined" onClick={onClear}>
          {lng === "ar" ? "مسح" : "Clear"}
        </Button>
        <Button onClick={onSave} variant="contained" disabled={disabled}>
          {lng === "ar" ? "حفظ" : "Save"}
        </Button>
      </Stack>
    </Box>
  </Paper>
);

// ========== Image signature (tight crop) – Auto Preview on file select
const SignatureImagePanel = ({
  lng,
  file,
  setFileAndAutoPreview, // CHANGED: single setter that also triggers preview
  ratioInfo,
  error,
  processedPreview,
  hasProcessed,
  onConfirmUpload,
  disabled,
}) => (
  <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
    <Typography variant="h6" sx={{ mb: 1 }}>
      {lng === "ar" ? "رفع صورة التوقيع فقط" : "Upload Signature Image Only"}
    </Typography>

    <Typography variant="body2" sx={{ mb: 2 }}>
      {lng === "ar"
        ? "رجاءً قص الصورة بحيث تحتوي على التوقيع فقط بدون خلفية زائدة. يفضّل نسبة 5:2. ستظهر المعاينة تلقائيًا بعد اختيار الصورة."
        : "Please tightly crop so the image contains signature only. Ideal aspect ratio ~5:2. A preview will appear automatically after you choose an image."}
    </Typography>

    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems="center"
    >
      <Button variant="outlined" component="label" disabled={disabled}>
        {lng === "ar" ? "اختر صورة" : "Choose Image"}
        <input
          type="file"
          hidden
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            setFileAndAutoPreview(f);
          }}
        />
      </Button>

      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
        {file
          ? (lng === "ar" ? "الصورة المختارة: " : "Selected image: ") +
            file.name
          : lng === "ar"
          ? "لم يتم اختيار صورة"
          : "No image selected"}
      </Typography>

      {/* Preview button removed */}
      <Button
        variant="contained"
        disabled={!hasProcessed || disabled}
        onClick={onConfirmUpload}
      >
        {lng === "ar" ? "تأكيد الرفع" : "Confirm Upload"}
      </Button>
    </Stack>

    {ratioInfo ? (
      <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
        {lng === "ar"
          ? `نسبة أبعاد الصورة: ${ratioInfo}`
          : `Image aspect ratio: ${ratioInfo}`}
      </Typography>
    ) : null}

    {error && (
      <Alert severity="warning" sx={{ mt: 2 }}>
        {error}
      </Alert>
    )}

    {processedPreview && (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2">
          {lng === "ar" ? "المعاينة" : "Preview"}
        </Typography>
        <Box
          component="img"
          src={processedPreview}
          alt="signature preview"
          sx={{
            mt: 1,
            width: "100%",
            maxWidth: 500,
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        />
        <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
          {lng === "ar"
            ? `سيتم الحفظ بالمقاس ${TARGET_WIDTH}×${TARGET_HEIGHT} بكسل (PNG)`
            : `Will be saved as ${TARGET_WIDTH}×${TARGET_HEIGHT} px (PNG)`}
        </Typography>
      </Box>
    )}
  </Paper>
);

// ---------- Main component ----------
const ContractSignature = ({
  session,
  token,
  nextStatus,
  onSignatureSaved,
  disabled,
  handleBack,
  reqUrl = `client/contracts/generate-pdf`,
}) => {
  const { lng } = useLanguageSwitcherContext();
  const sigCanvas = useRef({});
  const { setProgress, setOverlay } = useUploadContext();
  const { setLoading: setToastLoading } = useToastContext();
  const { setAlertError } = useAlertContext();

  // method: online | image | hand
  const [method, setMethod] = useState("online");

  // Online drawing
  const handleClearCanvas = () => {
    if (sigCanvas.current) sigCanvas.current.clear();
  };

  const getSignatureAsFile = async () => {
    if (!sigCanvas.current) return null;
    const canvas = sigCanvas.current.getCanvas();
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    return new File([blob], `signature-${token || "custom"}.png`, {
      type: "image/png",
    });
  };

  const handleExternalUploadOnline = async () => {
    if (sigCanvas.current && sigCanvas.current.isEmpty()) {
      setAlertError(
        lng === "ar" ? "يرجى التوقيع قبل الحفظ." : "Please sign before saving."
      );
      return;
    }
    const file = await getSignatureAsFile();
    if (!file) {
      setAlertError(
        lng === "ar" ? "تعذر قراءة التوقيع." : "Could not read the signature."
      );
      return;
    }
    const uploadResponse = await uploadInChunks(file, setProgress, setOverlay);
    const url = uploadResponse?.url;
    if (!url) {
      setAlertError(
        lng === "ar" ? "فشل رفع التوقيع." : "Failed to upload signature."
      );
      return;
    }
    const request = await handleRequestSubmit(
      {
        sessionData: session,
        signatureUrl: url, // ONLINE path
        sessionStatus: nextStatus,
        lng,
      },
      setToastLoading,
      reqUrl,
      false,
      lng === "ar" ? "اعتماد" : "Approving"
    );
    if (request?.status === 200) onSignatureSaved?.();
  };

  // Image-only (tight crop) state + auto-preview
  const [sigImageFile, setSigImageFile] = useState(null);
  const [processedPreview, setProcessedPreview] = useState(null);
  const [processedBlob, setProcessedBlob] = useState(null);
  const [ratioInfo, setRatioInfo] = useState("");
  const [imgErr, setImgErr] = useState("");
  const hasProcessed = !!processedBlob;

  // CHANGED: can accept a file argument for immediate processing
  const handleImagePreview = async (fileArg) => {
    setImgErr("");
    if (processedPreview) {
      URL.revokeObjectURL(processedPreview);
      setProcessedPreview(null);
    }
    setProcessedBlob(null);

    const chosen = fileArg || sigImageFile;
    if (!chosen) {
      setAlertError(
        lng === "ar" ? "اختر صورة للتوقيع." : "Please choose a signature image."
      );
      return;
    }
    try {
      const img = await loadImage(chosen);
      const ratio = (img.width / img.height).toFixed(3);
      setRatioInfo(`${ratio} (w:${img.width}, h:${img.height})`);

      const canvas = cropToAspect(img, TARGET_WIDTH, TARGET_HEIGHT);
      const blob = await blobFromCanvas(canvas);
      const previewUrl = URL.createObjectURL(blob);

      setProcessedBlob(blob);
      setProcessedPreview(previewUrl);
    } catch (e) {
      setImgErr(
        lng === "ar"
          ? "خطأ أثناء معالجة الصورة. جرّب صورة أخرى أو قصّها بشكل أوضح."
          : "Error processing the image. Try another image or crop more tightly."
      );
    }
  };

  const handleImageConfirmUpload = async () => {
    if (!processedBlob) {
      setAlertError(
        lng === "ar" ? "لا توجد معاينة جاهزة." : "No preview generated yet."
      );
      return;
    }
    const file = new File(
      [processedBlob],
      `signature-only-${token || "custom"}.png`,
      { type: "image/png" }
    );
    const uploadResponse = await uploadInChunks(file, setProgress, setOverlay);
    const url = uploadResponse?.url;
    if (!url) {
      setAlertError(
        lng === "ar" ? "فشل رفع التوقيع." : "Failed to upload signature."
      );
      return;
    }
    const request = await handleRequestSubmit(
      {
        sessionData: session,
        signatureUrl: url, // same signatureUrl field
        sessionStatus: nextStatus,
        lng,
      },
      setToastLoading,
      reqUrl,
      false,
      lng === "ar" ? "اعتماد" : "Approving"
    );
    if (request?.status === 200) onSignatureSaved?.();
  };

  // Helper passed to child: set file AND auto-generate preview
  const setFileAndAutoPreview = (f) => {
    // reset previous preview
    if (processedPreview) URL.revokeObjectURL(processedPreview);
    setProcessedPreview(null);
    setProcessedBlob(null);
    setRatioInfo("");
    setImgErr("");

    setSigImageFile(f);
    if (f) {
      // immediately generate preview from this file
      handleImagePreview(f);
    }
  };

  return (
    <Box sx={{ px: 1 }}>
      <MethodSelector method={method} onChange={setMethod} lng={lng} />

      {method === "online" && (
        <OnlineSignPanel
          lng={lng}
          sigCanvas={sigCanvas}
          disabled={disabled}
          onClear={handleClearCanvas}
          onSave={handleExternalUploadOnline}
          handleBack={handleBack}
        />
      )}

      {method === "image" && (
        <SignatureImagePanel
          lng={lng}
          file={sigImageFile}
          setFileAndAutoPreview={setFileAndAutoPreview} // CHANGED
          ratioInfo={ratioInfo}
          error={imgErr}
          processedPreview={processedPreview}
          hasProcessed={hasProcessed}
          onConfirmUpload={handleImageConfirmUpload}
          disabled={disabled}
        />
      )}
    </Box>
  );
};

export default ContractSignature;

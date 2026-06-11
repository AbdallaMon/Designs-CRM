"use client";

import { useState } from "react";
import { Alert, Box, Link, Snackbar, TextField } from "@mui/material";
import { FILE_SIZE_LIMIT } from "../config/siteUtilityConstants.js";

/**
 * Minimal file picker for the site-utility PDF field editor. Self-contained v2 version of
 * the legacy SimpleFileInput — validates size/accept, then hands the file to `onPick`
 * (the parent runs the chunked upload via the v2 useUpload hook). Behaviour/appearance is
 * preserved from the legacy admin UI.
 */
export default function SiteFileInput({
  id,
  label = "File",
  accept = "image/*",
  variant = "outlined",
  onPick,
  helperText = `الحد الأقصى لحجم الملف: ${FILE_SIZE_LIMIT / (1024 * 1024)} MB`,
}) {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    if (file.size > FILE_SIZE_LIMIT) {
      setError(`حجم الملف يتجاوز الحد المسموح (${FILE_SIZE_LIMIT / (1024 * 1024)} MB).`);
      setPreview(null);
      setFileName("");
      return;
    }
    const isImage = accept?.includes("image/*");
    const isVideo = accept?.includes("video/*");
    const isPdf = accept?.includes("application/pdf");
    const ft = file.type;
    const isAccepted =
      !accept ||
      (isImage && ft.startsWith("image/")) ||
      (isVideo && ft.startsWith("video/")) ||
      (isPdf && ft === "application/pdf");
    if (!isAccepted) {
      setError("نوع الملف غير مسموح به.");
      setPreview(null);
      setFileName("");
      return;
    }
    setError(null);
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
    onPick?.(file);
  };

  return (
    <>
      <Box display="flex" gap={2} alignItems="center">
        <TextField
          label={label}
          id={id}
          type="file"
          variant={variant}
          helperText={helperText}
          fullWidth
          size="small"
          onChange={handleChange}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { accept },
          }}
        />
        {preview && (
          <Link href={preview} target="_blank" rel="noopener noreferrer">
            {fileName || "عرض الملف"}
          </Link>
        )}
      </Box>
      {error && (
        <Snackbar
          open={Boolean(error)}
          autoHideDuration={2500}
          onClose={() => setError(null)}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            variant="filled"
            sx={{ width: "100%" }}
          >
            {error}
          </Alert>
        </Snackbar>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Stack,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput.jsx";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";

export default function AddDrawingDialog({ open, onClose, onCreate }) {
  const { setProgress, setOverlay } = useUploadContext();
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (open) {
      setUrl("");
      setFileName("");
    }
  }, [open]);

  const handleUpload = async (file) => {
    if (!file) return;
    const res = await uploadInChunks(file, setProgress, setOverlay);
    if (res?.status === 200 && res?.url) setUrl(res.url);
  };

  const canSave = !!url.trim();

  const save = async () => {
    await onCreate({ url: url.trim(), fileName: fileName.trim() || "" });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600 }}>Add Drawing</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 2 }}>
          <TextField
            label="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            size="small"
          />
          <SimpleFileInput
            label="File"
            id="drawing-file"
            variant="outlined"
            handleUpload={handleUpload}
            input={{ accept: "image/*" }}
          />
          <TextField
            label="File Name (Optional)"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            fullWidth
            size="small"
          />
          {!!url && (
            <Typography variant="caption" color="text.secondary">
              Will use {url.startsWith("http") ? "URL" : "uploaded file"} when
              saving.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={!canSave} variant="contained">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

"use client";

// Add-file dialog — ports the legacy AddFilesDialog flow onto the v2 chunk uploader
// (hooks/useUpload → files/chunks) + the leads service. Gated on capabilities.canAddFile.
// Flow: pick a file → uploadAsChunk (shows UploadOverlay) → POST /:id/files with the
// returned url (body matches LeadValidation.createFile: { url, name, description }).

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { BsPlus } from "react-icons/bs";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { useUpload } from "@/app/v2/hooks/useUpload.js";
import { UploadOverlay } from "@/app/v2/shared/components/feedback/UploadOverlay.jsx";
import { leadsService } from "@/app/v2/features/leads/leads.service.js";
import { runLeadMutation } from "@/app/v2/features/leads/leads.mutations.js";

export function AddFileDialog({ lead, canAdd, onCreated }) {
  const [open, setOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const { setLoading } = useToastContext();
  const { uploadAsChunk, progress, fileName, uploadSpeed, isUploading } = useUpload({
    onUploadStart: () => setShowOverlay(true),
    onUploadEnd: () => setShowOverlay(false),
  });

  if (!canAdd) return null;

  function onPick(e) {
    const f = e.target.files?.[0];
    setFile(f || null);
    if (f && !name) setName(f.name);
  }

  function reset() {
    setName("");
    setDescription("");
    setFile(null);
  }

  async function handleSave() {
    if (!file || !name) return;
    const uploaded = await uploadAsChunk({ file });
    if (!uploaded || uploaded.status !== 200) return;
    const res = await runLeadMutation(
      () =>
        leadsService.createFile(lead.id, {
          url: uploaded.url,
          name,
          description: description || undefined,
        }),
      { setLoading, loading: "جاري الحفظ..." },
    );
    if (res) {
      onCreated?.(res.data);
      reset();
      setOpen(false);
    }
  }

  return (
    <>
      <UploadOverlay
        showOverlay={showOverlay}
        progress={progress}
        fileName={fileName}
        uploadSpeed={uploadSpeed}
      />
      <Button
        onClick={() => setOpen(true)}
        variant="contained"
        startIcon={<BsPlus size={20} />}
        sx={{ alignSelf: "flex-start" }}
      >
        إضافة ملف
      </Button>
      {open && (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth dir="rtl">
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>ملف جديد</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="اسم الملف"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="الوصف"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Button component="label" variant="outlined">
                {file ? file.name : "اختر ملفاً"}
                <input type="file" hidden onChange={onPick} />
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={() => setOpen(false)} variant="outlined">
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={!file || !name || isUploading}
            >
              حفظ
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

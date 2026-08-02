"use client";

import { useEffect, useState } from "react";
import {
  Stack,
  Card,
  CardHeader,
  CardContent,
  Divider,
  IconButton,
  TextField,
  useTheme,
  alpha,
} from "@mui/material";
import { FaEdit, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import SimpleFileInput from "@/shared/components/formComponents/SimpleFileInput.jsx";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import ConfirmDialog from "@/features/contracts/view/ConfirmDialog.jsx";
import { diffPayload } from "@/features/contracts/view/viewContractHelpers.js";

export default function DrawingRow({ row, contractId, onReload }) {
  const theme = useTheme();
  const { setProgress, setOverlay } = useUploadContext();
  const [edit, setEdit] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    url: row.url,
    fileName: row.fileName || "",
  });
  const { setLoading } = useToastContext();

  useEffect(() => {
    setForm({ url: row.url, fileName: row.fileName || "" });
  }, [row.id, row.url, row.fileName]);

  const save = async () => {
    const payload = diffPayload(
      { url: row.url, fileName: row.fileName || "" },
      form
    );
    if (Object.keys(payload).length === 0) return setEdit(false);
    const req = await handleRequestSubmit(
      payload,
      setLoading,
      `contracts/${contractId}/drawings/${row.id}`,
      false,
      "Updating",
      false,
      "PUT"
    );

    if (req.status === 200) {
      setEdit(false);
      await onReload();
    }
  };

  const remove = async () => {
    const req = await handleRequestSubmit(
      {},
      setLoading,
      `contracts/${contractId}/drawings/${row.id}`,
      false,
      "Updating",
      false,
      "DELETE"
    );

    if (req.status === 200) {
      await onReload();
    }
  };

  const uploadReplace = async (file) => {
    if (!file) return;
    const res = await uploadInChunks(file, setProgress, setOverlay);
    if (res?.status === 200 && res?.url) {
      setForm((o) => ({ ...o, url: res.url }));
    }
  };

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.info.main,
            0.05
          )} 0%, ${alpha(theme.palette.info.main, 0.01)} 100%)`,
          borderRadius: 2,
          "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
          transition: "all 0.3s ease",
        }}
      >
        <CardHeader
          title={row.fileName || "Drawing"}
          subheader={row.url}
          titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
          action={
            <Stack direction="row" spacing={0.5}>
              {edit ? (
                <>
                  <IconButton color="primary" onClick={save} size="small">
                    <FaSave />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => setEdit(false)}
                    size="small"
                  >
                    <FaTimes />
                  </IconButton>
                </>
              ) : (
                <IconButton onClick={() => setEdit(true)} size="small">
                  <FaEdit />
                </IconButton>
              )}
              <IconButton
                color="error"
                onClick={() => setConfirmOpen(true)}
                size="small"
              >
                <FaTrash />
              </IconButton>
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="URL"
              value={form.url}
              onChange={(e) => setForm((o) => ({ ...o, url: e.target.value }))}
              disabled={!edit}
              fullWidth
              size="small"
            />
            {edit && (
              <SimpleFileInput
                label="Replace File"
                id={`file-${row.id}`}
                variant="outlined"
                handleUpload={uploadReplace}
                input={{ accept: "image/*" }}
              />
            )}
            <TextField
              label="File Name (Optional)"
              value={form.fileName}
              onChange={(e) =>
                setForm((o) => ({ ...o, fileName: e.target.value }))
              }
              disabled={!edit}
              fullWidth
              size="small"
            />
          </Stack>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await remove();
        }}
        title="Delete Drawing"
        content={`Delete drawing "${
          row.fileName || row.url
        }"? This action cannot be undone.`}
      />
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { FaEdit, FaLink, FaSave, FaTimes } from "react-icons/fa";
import { useUpload } from "@/app/v2/hooks/useUpload";
import { useUploadContext } from "@/app/v2/providers/UploadingProvider";
import SiteFileInput from "./SiteFileInput.jsx";

function isImageUrl(u) {
  if (!u) return false;
  try {
    const ext = u.split(".").pop()?.toLowerCase();
    return ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext);
  } catch {
    return false;
  }
}

function ImgOrLink({ label, url }) {
  if (!url) {
    return (
      <Stack spacing={1} alignItems="flex-start">
        <Typography color="text.secondary">لا يوجد {label}</Typography>
        <Typography variant="caption" color="text.secondary">
          اضغط تعديل للإضافة.
        </Typography>
      </Stack>
    );
  }
  const showImg = isImageUrl(url);
  return (
    <Stack spacing={1}>
      {showImg ? (
        <Box
          component="img"
          src={url}
          alt={label}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            width: "100%",
            maxHeight: 280,
            objectFit: "contain",
            bgcolor: "background.default",
          }}
        />
      ) : (
        <Stack direction="row" spacing={1} alignItems="center">
          <FaLink />
          <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
            {url}
          </Typography>
        </Stack>
      )}
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar sx={{ width: 24, height: 24 }}>
          {label?.[0]?.toUpperCase() || "U"}
        </Avatar>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Stack>
    </Stack>
  );
}

/**
 * Single PDF-utility field card with an edit dialog (URL text + file upload). Migrated
 * from the legacy PdfUtilityFieldCard. Upload uses the v2 useUpload (chunked) +
 * UploadingProvider overlay; save delegates to the parent `onSave(itemKey, url)` which
 * upserts the singleton (and toasts).
 */
export default function PdfUtilityFieldCard({
  title,
  value,
  itemKey,
  disabled,
  onSave,
}) {
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(value || "");
  const [saving, setSaving] = useState(false);

  const { setProgress, setOverlay, setFileName } = useUploadContext();
  const { uploadAsChunk } = useUpload({
    onUploadStart: () => setOverlay(true),
    onUploadEnd: () => setOverlay(false),
  });

  const handleUploadFile = async (file) => {
    if (!file) return;
    setFileName?.(file.name);
    setProgress(0);
    const up = await uploadAsChunk({ file });
    if (up?.status === 200 && up?.url) setUrl(up.url);
  };

  const handleOpen = () => {
    setUrl(value || "");
    setOpen(true);
  };
  const handleClose = () => {
    if (saving) return;
    setOpen(false);
  };

  const canSave = useMemo(() => !!url?.trim(), [url]);

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    const res = await onSave?.({ [itemKey]: url.trim() });
    setSaving(false);
    if (res) setOpen(false);
  };

  return (
    <>
      <Card
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        sx={{ height: "100%", position: "relative", opacity: disabled ? 0.6 : 1 }}
      >
        <CardHeader title={title} />
        <CardContent>
          <ImgOrLink label={title} url={value} />
        </CardContent>

        {!disabled && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              insetInlineEnd: 8,
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: hover ? 2 : 0,
              opacity: hover ? 1 : 0.8,
            }}
          >
            <Tooltip title={`تعديل ${title}`}>
              <span>
                <IconButton onClick={handleOpen} size="small" color="primary">
                  <FaEdit />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
      </Card>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{value ? `تعديل ${title}` : `إضافة ${title}`}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ sm: 6 }}>
                <TextField
                  label="الرابط"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ sm: 6 }}>
                <SiteFileInput
                  label="ملف"
                  id={`file-${itemKey}`}
                  accept="image/*"
                  onPick={handleUploadFile}
                />
              </Grid>
            </Grid>
            {url && (
              <Typography variant="caption" color="text.secondary">
                سيتم استخدام {isImageUrl(url) ? "الصورة المرفوعة" : "الرابط"} عند
                الحفظ.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<FaTimes />}
            onClick={handleClose}
            disabled={saving}
            color="inherit"
          >
            إغلاق
          </Button>
          <Button
            startIcon={<FaSave />}
            onClick={submit}
            disabled={!canSave || saving}
            variant="contained"
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

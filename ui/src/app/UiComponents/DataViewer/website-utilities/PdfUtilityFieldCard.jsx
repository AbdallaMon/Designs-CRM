"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Typography,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Avatar,
  Grid,
} from "@mui/material";
import { FaEdit, FaLink, FaSave, FaTimes } from "react-icons/fa";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import SimpleFileInput from "../../formComponents/SimpleFileInput";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";

function isImageUrl(u) {
  console.log(u, "u");
  if (!u) return false;
  try {
    const ext = u.split(".").pop()?.toLowerCase();
    console.log(ext, "ext");
    return ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext);
  } catch (e) {
    console.log("Invalid URL");
    return false;
  }
}

function ImgOrLink({ label, url }) {
  if (!url) {
    return (
      <Stack spacing={1} alignItems="flex-start">
        <Typography color="text.secondary">No {label} set</Typography>
        <Typography variant="caption" color="text.secondary">
          Click edit to add one.
        </Typography>
      </Stack>
    );
  }
  const showImg = isImageUrl(url);
  console.log(showImg, "showImg");
  console.log(url, "url");

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
          {label} URL
        </Typography>
      </Stack>
    </Stack>
  );
}

export default function PdfUtilityFieldCard({
  title,
  value,
  onSubmit,
  disabled,
  itemKey,
}) {
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(value || "");
  const { loading: saving, setLoading: setSaving } = useToastContext();

  const { setProgress, setOverlay } = useUploadContext();

  const handleUploadFile = async (file) => {
    if (!file) return;
    const up = await uploadInChunks(file, setProgress, setOverlay);
    if (up?.status === 200 && up?.url) setUrl(up.url);
  };

  const handleOpen = () => {
    setUrl(value || "");
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const canSave = useMemo(() => !!url?.trim(), [url]);

  const submit = async () => {
    if (!canSave) return;
    const res = await handleRequestSubmit(
      { [itemKey]: url },
      setSaving,
      `shared/site-utilities/pdf-utility`,
      false,
      "Updating utility..."
    );
    if (res?.status === 200) {
      if (onSubmit) onSubmit();
      setOpen(false);
    }
  };

  return (
    <>
      <Card
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        sx={{
          height: "100%",
          position: "relative",
          opacity: disabled ? 0.6 : 1,
        }}
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
              right: 8,
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: hover ? 2 : 0,
              opacity: hover ? 1 : 0.8,
            }}
          >
            <Tooltip title={`Edit ${title}`}>
              <span>
                <IconButton onClick={handleOpen} size="small" color="primary">
                  <FaEdit />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
      </Card>

      <Dialog
        open={open}
        onClose={saving ? undefined : handleClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{value ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ sm: 6 }}>
                <TextField
                  label="URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ sm: 6 }}>
                <SimpleFileInput
                  label="File"
                  id={`file-${title.replace(/\s+/g, "-").toLowerCase()}`}
                  variant="outlined"
                  input={{ accept: "image/*" }}
                  handleUpload={handleUploadFile}
                />
              </Grid>
            </Grid>
            {url && (
              <Typography variant="caption" color="text.secondary">
                Will use {isImageUrl(url) ? "uploaded image URL" : "URL"} when
                saving.
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
            Close
          </Button>
          <Button
            startIcon={<FaSave />}
            onClick={submit}
            disabled={!canSave || saving}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

"use client";

// Drawings editor for the create-contract flow. Ported from the legacy ContractDrawingsEditor,
// Arabic-only. A drawing is { url, fileName? }; the URL is either typed or produced by the v2
// AUTHED chunk upload (useUpload({ isClient:false }) → POST /v2/files/chunks → { url }).

import React, { useState } from "react";
import { Stack, Typography, Box, Button, Card, CardHeader, CardContent, Avatar, TextField, IconButton, Tooltip, Divider, Grid, alpha, useTheme } from "@mui/material";
import { FaPlus, FaTrash, FaRegImages } from "react-icons/fa";
import { useUpload } from "@/app/v2/hooks/useUpload";
import { useOverlay } from "@/app/v2/hooks/useOverlay";
import { useT } from "@/app/v2/lib/i18n";

export default function DrawingsEditor({ drawings, setDrawings }) {
  const { t } = useT();
  const theme = useTheme();
  const overlay = useOverlay();
  const { uploadAsChunk } = useUpload({
    isClient: false,
    onUploadStart: () => overlay.open(),
    onUploadEnd: () => overlay.close(),
  });
  const [uploadingIdx, setUploadingIdx] = useState(null);

  const addRow = () => setDrawings([...drawings, { url: "", fileName: "" }]);
  const updateRow = (idx, key, value) => {
    const copy = drawings.slice();
    copy[idx] = { ...copy[idx], [key]: value };
    setDrawings(copy);
  };
  const removeRow = (idx) => {
    const copy = drawings.slice();
    copy.splice(idx, 1);
    setDrawings(copy);
  };

  async function handleUploadFile(file, idx) {
    if (!file) return;
    setUploadingIdx(idx);
    try {
      const res = await uploadAsChunk({ file });
      if (res?.url) {
        updateRow(idx, "url", res.url);
        if (!drawings[idx]?.fileName) updateRow(idx, "fileName", res.fileName || file.name);
      }
    } finally {
      setUploadingIdx(null);
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <FaRegImages style={{ color: theme.palette.info.main, fontSize: 20 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{t("contracts.editors.drawings.title")}</Typography>
        <Box flex={1} />
        <Button startIcon={<FaPlus />} onClick={addRow} variant="contained" size="small">{t("contracts.editors.drawings.add")}</Button>
      </Stack>
      <Grid container spacing={2}>
        {drawings.map((d, idx) => (
          <Grid key={idx} size={{ xs: 12 }}>
            <Card variant="outlined" sx={{ border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`, borderRadius: 2 }}>
              <CardHeader
                title={`${t("contracts.editors.drawings.cardTitle")}${idx + 1}`}
                avatar={<Avatar sx={{ bgcolor: "info.main" }}>{idx + 1}</Avatar>}
                slotProps={{ title: { fontWeight: 600 } }}
              />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField label={t("contracts.editors.drawings.url")} value={d.url} onChange={(e) => updateRow(idx, "url", e.target.value)} fullWidth size="small" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button variant="outlined" component="label" disabled={uploadingIdx === idx} fullWidth>
                        {uploadingIdx === idx ? t("contracts.editors.drawings.uploading") : t("contracts.editors.drawings.chooseFile")}
                        <input type="file" hidden accept="image/*" onChange={(e) => handleUploadFile(e.target.files?.[0] || null, idx)} />
                      </Button>
                    </Grid>
                  </Grid>
                  <TextField label={t("contracts.editors.drawings.fileNameOptional")} value={d.fileName || ""} onChange={(e) => updateRow(idx, "fileName", e.target.value)} fullWidth size="small" />
                  {d.url && <Typography variant="caption" color="text.secondary">{t("contracts.editors.drawings.urlWillBeUsed")}</Typography>}
                  <Stack direction="row" justifyContent="flex-end">
                    <Tooltip title={t("contracts.editors.drawings.delete")}>
                      <span>
                        <IconButton color="error" onClick={() => removeRow(idx)} size="small"><FaTrash /></IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

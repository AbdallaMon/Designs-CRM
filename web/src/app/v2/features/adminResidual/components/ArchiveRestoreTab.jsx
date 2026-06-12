"use client";

// Archive / Restore tab — الأرشيف. The backend exposes ONLY a per-id toggle
// (PATCH /v2/admin/model/archived/:id?model=<x> with body { isArchived }) — there is NO list
// endpoint for archived records. So this is a minimal, explicit restore-by-id control over the
// BE allow-listed GLOBAL image-session reference models (style / colorPattern / material /
// space / designImage). The admin picks the model + the record id, then restores (isArchived
// = false) or re-archives (isArchived = true). Gated upstream by MODEL_ARCHIVE. Arabic / RTL.

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdRestore, MdArchive } from "react-icons/md";
import { adminResidualService } from "../adminResidual.service.js";
import { runAdminResidualMutation } from "../adminResidual.mutations.js";
import { ARCHIVE_MODELS } from "../config/constant.js";

export function ArchiveRestoreTab() {
  const [model, setModel] = useState(ARCHIVE_MODELS[0]?.value ?? "");
  const [recordId, setRecordId] = useState("");
  const [busy, setBusy] = useState(false);

  const validId = /^\d+$/.test(String(recordId).trim());

  async function toggle(isArchived) {
    if (!model || !validId) return;
    await runAdminResidualMutation(
      () =>
        adminResidualService.archiveModel(Number(recordId), {
          model,
          isArchived,
        }),
      {
        loading: isArchived ? "جاري الأرشفة..." : "جاري الاستعادة...",
        setLoading: setBusy,
      },
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        الأرشيف والاستعادة
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        استعادة أو أرشفة سجلات بيانات جلسات الصور المرجعية برقم السجل.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        لا تتوفر قائمة بالسجلات المؤرشفة من الخادم؛ يتم التحكم بحالة الأرشفة عبر رقم السجل مباشرة.
        أدخل النموذج ورقم السجل ثم اختر الاستعادة أو الأرشفة.
      </Alert>

      <Card variant="outlined" sx={{ maxWidth: 720 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="archive-model">النموذج</InputLabel>
                <Select
                  labelId="archive-model"
                  value={model}
                  label="النموذج"
                  onChange={(e) => setModel(e.target.value)}
                >
                  {ARCHIVE_MODELS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.labelAr}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="رقم السجل"
                value={recordId}
                onChange={(e) => setRecordId(e.target.value)}
                error={Boolean(recordId) && !validId}
                helperText={Boolean(recordId) && !validId ? "أدخل رقمًا صحيحًا" : " "}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<MdRestore />}
                  onClick={() => toggle(false)}
                  disabled={busy || !validId}
                >
                  استعادة
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<MdArchive />}
                  onClick={() => toggle(true)}
                  disabled={busy || !validId}
                >
                  أرشفة
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ArchiveRestoreTab;

"use client";

// Admin design-image uploader — single + bulk. Mirrors AddFileDialog's chunk-upload idiom
// (hooks/useUpload → files/chunks → { url }) and routes the create through the imageSessions
// service + mutation resolver (toast resolves the BE message CODE → Arabic). Gated by the
// caller (only mounted when canManage). Single-language Arabic / RTL.
//
// Backend contract (server/services/main/image-session/imageSessionSevices.js, FROZEN logic):
//   POST /v2/image-sessions/admin/images       body: { imageUrl, styleId, spaceIds:number[] }
//   POST /v2/image-sessions/admin/images/bulk   body: { imagesUrls:string[], styleId, spaceIds:number[] }
// (validation body is passthrough; the field names above are the service contract).
//
// Style/Space options come from listStyles/listSpaces; their `title` is a relation array, read
// via readPickListLabel(model, row).

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { MdUploadFile } from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { useUpload } from "@/app/v2/hooks/useUpload.js";
import { UploadOverlay } from "@/app/v2/shared/components/feedback/UploadOverlay.jsx";
import imageSessionsService from "../imageSessions.service.js";
import { runImageSessionMutation } from "../imageSessions.mutations.js";
import { PICK_LIST_MODELS, readPickListLabel } from "../config/imageSessionsConstants.js";

export function UploadImageDialog({ open, mode = "single", onClose, onSaved }) {
  const bulk = mode === "bulk";
  const { t } = useT();
  const { setLoading } = useToastContext();

  const [styleId, setStyleId] = useState("");
  const [spaceIds, setSpaceIds] = useState([]);
  const [files, setFiles] = useState([]); // File[]; single mode uses [0]

  const [styles, setStyles] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [showOverlay, setShowOverlay] = useState(false);
  const { uploadAsChunk, progress, fileName, uploadSpeed, isUploading } = useUpload({
    onUploadStart: () => setShowOverlay(true),
    onUploadEnd: () => setShowOverlay(false),
  });
  const [saving, setSaving] = useState(false);

  // Fetch the style + space pick-lists once the dialog opens.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setOptionsLoading(true);
    Promise.all([
      imageSessionsService.listStyles({ notArchived: true }),
      imageSessionsService.listSpaces({ notArchived: true }),
    ])
      .then(([styleRes, spaceRes]) => {
        if (!alive) return;
        setStyles(Array.isArray(styleRes?.data) ? styleRes.data : []);
        setSpaces(Array.isArray(spaceRes?.data) ? spaceRes.data : []);
      })
      .catch(() => {
        if (!alive) return;
        setStyles([]);
        setSpaces([]);
      })
      .finally(() => {
        if (alive) setOptionsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open]);

  function reset() {
    setStyleId("");
    setSpaceIds([]);
    setFiles([]);
  }

  function handleClose() {
    if (saving || isUploading) return;
    reset();
    onClose?.();
  }

  function onPick(e) {
    const picked = Array.from(e.target.files || []);
    setFiles(bulk ? picked : picked.slice(0, 1));
  }

  const spaceLabelFor = useMemo(
    () => (id) => {
      const row = spaces.find((s) => s.id === id);
      return row ? readPickListLabel(PICK_LIST_MODELS.SPACE, row) || `#${id}` : `#${id}`;
    },
    [spaces],
  );

  const canSubmit =
    Boolean(styleId) && spaceIds.length > 0 && files.length > 0 && !saving && !isUploading;

  async function handleSave() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      // Upload each selected file to get a relative /uploads URL.
      const urls = [];
      for (const file of files) {
        const uploaded = await uploadAsChunk({ file });
        if (!uploaded || uploaded.status !== 200 || !uploaded.url) {
          setSaving(false);
          return; // upload failed; useUpload already logged it
        }
        urls.push(uploaded.url);
      }

      const numericSpaceIds = spaceIds.map((id) => Number(id));
      const numericStyleId = Number(styleId);

      const res = await runImageSessionMutation(
        () =>
          bulk
            ? imageSessionsService.createBulkImage({
                imagesUrls: urls,
                styleId: numericStyleId,
                spaceIds: numericSpaceIds,
              })
            : imageSessionsService.createImage({
                imageUrl: urls[0],
                styleId: numericStyleId,
                spaceIds: numericSpaceIds,
              }),
        { setLoading, loading: t("imageSessions.upload.savingLoading", "جاري حفظ الصور...") },
      );

      if (res) {
        onSaved?.();
        reset();
        onClose?.();
      }
    } finally {
      setSaving(false);
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
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth dir="rtl">
        <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
          {bulk
            ? t("imageSessions.upload.titleBulk", "إضافة صور (متعددة)")
            : t("imageSessions.upload.titleSingle", "إضافة صورة")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth disabled={optionsLoading}>
              <InputLabel id="design-image-style-label">{t("imageSessions.upload.style", "الطراز")}</InputLabel>
              <Select
                labelId="design-image-style-label"
                label={t("imageSessions.upload.style", "الطراز")}
                value={styleId}
                onChange={(e) => setStyleId(e.target.value)}
              >
                {styles.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {readPickListLabel(PICK_LIST_MODELS.STYLE, s) || `#${s.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={optionsLoading}>
              <InputLabel id="design-image-spaces-label">{t("imageSessions.upload.spaces", "المساحات")}</InputLabel>
              <Select
                labelId="design-image-spaces-label"
                multiple
                value={spaceIds}
                onChange={(e) => setSpaceIds(e.target.value)}
                input={<OutlinedInput label={t("imageSessions.upload.spaces", "المساحات")} />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((id) => (
                      <Chip key={id} size="small" label={spaceLabelFor(id)} />
                    ))}
                  </Box>
                )}
              >
                {spaces.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {readPickListLabel(PICK_LIST_MODELS.SPACE, s) || `#${s.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button component="label" variant="outlined" startIcon={<MdUploadFile />}>
              {files.length > 0
                ? bulk
                  ? t("imageSessions.upload.filesSelected", "{count} ملف محدد").replace("{count}", files.length)
                  : files[0].name
                : bulk
                  ? t("imageSessions.upload.pickImages", "اختر صوراً")
                  : t("imageSessions.upload.pickImage", "اختر صورة")}
              <input
                type="file"
                hidden
                accept="image/*"
                multiple={bulk}
                onChange={onPick}
              />
            </Button>

            {bulk && files.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {files.map((f) => f.name).join("، ")}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={handleClose} variant="outlined" disabled={saving || isUploading}>
            {t("imageSessions.upload.cancel", "إلغاء")}
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary" disabled={!canSubmit}>
            {t("imageSessions.upload.save", "حفظ")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default UploadImageDialog;

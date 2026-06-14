"use client";

import React from "react";
import {
  Stack,
  Typography,
  Box,
  TextField,
  IconButton,
  Tooltip,
  Grid,
  alpha,
  useTheme,
} from "@mui/material";
import { FaPlus, FaTrash, FaRegImages } from "react-icons/fa";
import SimpleFileInput from "../../../formComponents/SimpleFileInput";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { SectionHeader, EditorCard, EmptyState, AddButton } from "./formKit";

export default function ContractDrawingsEditor({ drawings, setDrawings }) {
  const { setProgress, setOverlay } = useUploadContext();
  const theme = useTheme();
  const info = theme.palette.info.main;

  const addRow = () =>
    setDrawings([...drawings, { url: "", file: null, fileName: "" }]);

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
    if (file) {
      const fileUpload = await uploadInChunks(file, setProgress, setOverlay);
      if (fileUpload.status === 200) {
        const copy = drawings.slice();
        copy[idx] = { ...copy[idx], url: fileUpload.url };
        setDrawings(copy);
      }
    }
  }

  return (
    <Stack spacing={2}>
      <SectionHeader
        icon={<FaRegImages />}
        title="المخططات (اختياري)"
        subtitle="أرفق روابط أو ملفات المخططات المرتبطة بالعقد"
        count={drawings.length}
        color={info}
        action={
          <AddButton
            onClick={addRow}
            label="إضافة مخطط"
            startIcon={<FaPlus />}
            color={info}
          />
        }
      />

      {drawings.length === 0 ? (
        <EmptyState
          icon={<FaRegImages />}
          color={info}
          text="لا توجد مخططات — يمكنك إضافة رابط أو رفع ملف."
          action={
            <AddButton
              onClick={addRow}
              label="إضافة مخطط"
              startIcon={<FaPlus />}
              color={info}
            />
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {drawings.map((d, idx) => (
            <EditorCard
              key={idx}
              accent={info}
              index={idx + 1}
              label={`المخطط #${idx + 1}`}
              onRemove={
                <Tooltip title="حذف">
                  <span>
                    <IconButton
                      color="error"
                      onClick={() => removeRow(idx)}
                      size="small"
                    >
                      <FaTrash />
                    </IconButton>
                  </span>
                </Tooltip>
              }
            >
              <Stack spacing={1.5}>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="الرابط"
                      value={d.url}
                      onChange={(e) => updateRow(idx, "url", e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <SimpleFileInput
                      label="ملف"
                      id={`file-${idx}`}
                      variant="outlined"
                      input={{ accept: "image/*" }}
                      handleUpload={(file) => {
                        handleUploadFile(file, idx);
                      }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="اسم الملف (اختياري)"
                  value={d.fileName || ""}
                  onChange={(e) => updateRow(idx, "fileName", e.target.value)}
                  fullWidth
                  size="small"
                />

                {(d.file || d.url) && (
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.75,
                      borderRadius: 1.5,
                      bgcolor: alpha(info, 0.08),
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      سيتم استخدام {d.file ? "الصورة المرفوعة" : "الرابط"} عند
                      الحفظ.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </EditorCard>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

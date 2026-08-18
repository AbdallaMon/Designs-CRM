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
import SimpleFileInput from "@/shared/components/formComponents/SimpleFileInput.jsx";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { SectionHeader, EditorCard, EmptyState, AddButton } from "@/features/contracts/shared/formKit.jsx";
import { FilePreview } from "@/shared/components/utility/Files.jsx";

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
        title="Drawings (Optional)"
        subtitle="Attach links or files of drawings related to the contract"
        count={drawings.length}
        color={info}
        action={
          <AddButton
            onClick={addRow}
            label="Add"
            startIcon={<FaPlus />}
            color={info}
          />
        }
      />

      {drawings.length === 0 ? (
        <EmptyState
          icon={<FaRegImages />}
          color={info}
          text="No drawings — you can add a link or upload a file."
          action={
            <AddButton
              onClick={addRow}
              label="Add"
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
              label={`Drawing #${idx + 1}`}
              onRemove={
                <Tooltip title="Remove">
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
                      label="URL"
                      value={d.url}
                      onChange={(e) => updateRow(idx, "url", e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <SimpleFileInput
                      label="File"
                      id={`file-${idx}`}
                      variant="outlined"
                      input={{ accept: "image/*,application/pdf" }}
                      handleUpload={(file) => {
                        handleUploadFile(file, idx);
                      }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="File Name (Optional)"
                  value={d.fileName || ""}
                  onChange={(e) => updateRow(idx, "fileName", e.target.value)}
                  fullWidth
                  size="small"
                />

                {d.url && (
                  <FilePreview
                    file={{ url: d.url, name: d.fileName || undefined }}
                    imageMaxHeight={260}
                  />
                )}

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
                      Will use {d.file ? "uploaded image" : "URL"} when saving.
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

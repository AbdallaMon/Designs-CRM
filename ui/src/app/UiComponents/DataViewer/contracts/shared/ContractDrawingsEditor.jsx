"use client";

import React from "react";
import {
  Stack,
  Typography,
  Box,
  Button,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  TextField,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  alpha,
  useTheme,
} from "@mui/material";
import { FaPlus, FaTrash, FaRegImages } from "react-icons/fa";
import SimpleFileInput from "../../../formComponents/SimpleFileInput";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";

export default function ContractDrawingsEditor({ drawings, setDrawings }) {
  const { setProgress, setOverlay } = useUploadContext();
  const theme = useTheme();

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
      <Stack direction="row" alignItems="center" spacing={1}>
        <FaRegImages style={{ color: theme.palette.info.main, fontSize: 20 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Drawings (Optional)
        </Typography>
        <Box flex={1} />
        <Button
          startIcon={<FaPlus />}
          onClick={addRow}
          variant="contained"
          size="small"
        >
          Add
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {drawings.map((d, idx) => (
          <Grid key={idx} size={{ xs: 12, md: 12 }}>
            <Card
              variant="outlined"
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.info.main,
                  0.08
                )} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                borderRadius: 2,
                "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                transition: "all 0.3s ease",
              }}
            >
              <CardHeader
                title={`Drawing #${idx + 1}`}
                avatar={
                  <Avatar sx={{ bgcolor: "info.main" }}>{idx + 1}</Avatar>
                }
                titleTypographyProps={{ fontWeight: 600 }}
              />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  <Grid container spacing={2}>
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
                        input={{ accept: "image/*" }}
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

                  {(d.file || d.url) && (
                    <Typography variant="caption" color="text.secondary">
                      Will use {d.file ? "uploaded image" : "URL"} when saving.
                    </Typography>
                  )}

                  <Stack direction="row" justifyContent="flex-end">
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

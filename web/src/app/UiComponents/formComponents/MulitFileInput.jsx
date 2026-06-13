"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Link,
  Snackbar,
  TextField,
  InputAdornment,
} from "@mui/material";
import { MdAttachFile } from "react-icons/md";

export default function MultiFileInput({
  input,
  id,
  label,
  variant = "filled",
  data,
  setData,
  handleUpload,
  helperText = "Max file size per file: 80MB",
}) {
  const [previews, setPreviews] = useState([]); // URLs
  const [fileNames, setFileNames] = useState([]); // Names
  const [error, setError] = useState(null); // Error message

  const handleFileChange = (filesLike) => {
    const files = Array.isArray(filesLike)
      ? filesLike
      : Array.from(filesLike || []);

    const MAX_FILE_SIZE = 80 * 1024 * 1024;
    const validFiles = [];
    const urls = [];
    const names = [];

    for (let file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds the 80MB limit.`);
        return;
      }
      validFiles.push(file);
      names.push(file.name);
      urls.push(URL.createObjectURL(file));
    }

    // Revoke old object URLs before replacing
    setPreviews((old) => {
      old.forEach((u) => URL.revokeObjectURL(u));
      return urls;
    });
    setFileNames(names);
    setError(null);

    if (setData) {
      setData((old) => ({ ...old, [id]: validFiles }));
    }

    if (handleUpload) {
      validFiles.forEach(handleUpload);
    }
  };

  const renderPreviews = () =>
    previews.map((url, index) => (
      <Link
        key={index}
        sx={{ display: "block", mt: 1 }}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {fileNames[index] || `File ${index + 1}`}
      </Link>
    ));

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  return (
    <>
      <Box display="flex" flexDirection="column" gap={1}>
        <TextField
          id={id}
          label={label}
          type="file"
          variant={variant}
          fullWidth
          helperText={helperText}
          InputLabelProps={{ shrink: true }}
          inputProps={{
            accept: input?.accept,
            multiple: true,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdAttachFile />
              </InputAdornment>
            ),
          }}
          onChange={(e) => handleFileChange(e.target.files)}
          sx={(theme) => ({
            backgroundColor:
              variant === "outlined"
                ? theme.palette.background.default
                : "inherit",
          })}
        />
        {renderPreviews()}
      </Box>

      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={3000}
          onClose={() => setError(null)}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            variant="filled"
            sx={{ width: "100%" }}
          >
            {error}
          </Alert>
        </Snackbar>
      )}
    </>
  );
}

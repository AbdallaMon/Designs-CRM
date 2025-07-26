import { Alert, Box, Button, Link, Snackbar, TextField } from "@mui/material";
import { useState } from "react";

export default function SimpleFileInput({
  input,
  id,
  label,
  variant = "filled",
  setData,
  handleUpload,
  helperText = "Max file uploads : 80 mb",
}) {
  const [preview, setPreview] = useState();
  const [fileName, setFileName] = useState(""); // Track file name
  const [error, setError] = useState(null); // Track file error
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const MAX_FILE_SIZE = 80 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the 80 MB limit.`);
      setPreview(null);
      setFileName("");
      return;
    }
    setError(null);
    if (file) {
      setFileName(file.name); // Store file name
      const reader = new FileReader();
      const fileBlob = URL.createObjectURL(file);
      setPreview(fileBlob);
      if (setData) {
        setData((old) => ({ ...old, [id]: file }));
      }
      if (handleUpload) {
        handleUpload(file);
      }
    } else {
      setPreview(null);
    }
  };
  // const isPdf = preview && (preview.startsWith("blob:") || preview.endsWith(".pdf"));
  const renderPreview = () => {
    if (!preview) return null;
    return (
      <Link sx={{}} href={preview} target="_blank" rel="noopener noreferrer">
        {fileName || "Show file"}
      </Link>
    );
  };

  return (
    <>
      <Box display="flex" gap={2}>
        <TextField
          label={label}
          id={id}
          sx={(theme) => ({
            backgroundColor:
              variant === "outlined"
                ? theme.palette.background.default
                : "inherit",
          })}
          type="file"
          InputLabelProps={{ shrink: true }}
          variant={variant}
          helperText={helperText}
          fullWidth
          accept={input && input?.accept}
          onChange={(e) => {
            handleFileChange(e);
          }}
        />
        {renderPreview()}
      </Box>
      {error && (
        <Snackbar
          open={error}
          autoHideDuration={2000}
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

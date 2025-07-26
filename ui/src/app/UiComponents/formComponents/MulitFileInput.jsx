import { Alert, Box, Button, Link, Snackbar, TextField } from "@mui/material";
import { MuiFileInput } from "mui-file-input";
import { useState } from "react";
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
  const [previews, setPreviews] = useState([]); // Array of file preview URLs
  const [fileNames, setFileNames] = useState([]); // Array of file names
  const [error, setError] = useState(null); // Error message

  const handleFileChange = (files) => {
    const MAX_FILE_SIZE = 80 * 1024 * 1024;
    const validFiles = [];
    const fileBlobs = [];
    const names = [];

    for (let file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds the 80MB limit.`);
        return;
      }
      validFiles.push(file);
      names.push(file.name);
      fileBlobs.push(URL.createObjectURL(file));
    }

    setError(null);
    setFileNames(names);
    setPreviews(fileBlobs);

    if (setData) {
      setData((old) => ({ ...old, [id]: validFiles }));
    }

    if (handleUpload) {
      validFiles.forEach(handleUpload);
    }
  };

  const renderPreviews = () => {
    return previews.map((url, index) => (
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
  };

  return (
    <>
      <Box display="flex" flexDirection="column" gap={1}>
        <MuiFileInput
          id={id}
          fullWidth
          accept={input?.accept}
          helperText={helperText}
          value={data?.[id]}
          onChange={handleFileChange}
          label={label}
          InputProps={{
            inputProps: {
              accept: input?.accept,
            },
            startAdornment: <MdAttachFile />,
          }}
          multiple
        />

        {/* <TextField
          label={label}
          id={id}
          type="file"
          //   multiple
          InputLabelProps={{ shrink: true }}
          variant={variant}
          fullWidth
          accept={input?.accept}
          helperText={helperText}
          onChange={handleFileChange}
          sx={(theme) => ({
            backgroundColor:
              variant === "outlined"
                ? theme.palette.background.default
                : "inherit",
          })}
        /> */}
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

import { Controller } from "react-hook-form";
import { Alert, Box, Snackbar, TextField } from "@mui/material";
import { useState } from "react";

export default function MuiFileField({
  control,
  input,
  register,
  errors,
  variant = "filled",
  setValue,
  noValue = false,
}) {
  const { id, label } = input.data;
  const [preview, setPreview] = useState(
    input.value || input.data.defaultValue || input.preview
  );

  const [fileName, setFileName] = useState(""); // Track file name
  const [error, setError] = useState(null); // Track file error

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError(null); // Reset error on new file selection

    if (file) {
      if (input.acceptOnly === "pdf" && file.type !== "application/pdf") {
        setError("الملف يجب أن يكون بصيغة PDF فقط");
        setValue(id, null);
        setPreview(null);
        return;
      } else if (
        input.acceptOnly === "image" &&
        !file.type.startsWith("image/")
      ) {
        setError("الملف يجب أن يكون صورة فقط");
        setValue(id, null);
        setPreview(null);
        return;
      }
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        setError("نوع الملف غير مدعوم (يجب ان يكون الملف صورة او pdf)");
        setValue(id, null);
        setPreview(null);
        return;
      }

      setFileName(file.name); // Store file name

      const reader = new FileReader();
      if (file.type === "application/pdf") {
        // Use blob URL for PDFs
        const pdfBlob = URL.createObjectURL(file);
        setPreview(pdfBlob);
      } else if (file.type.startsWith("image/")) {
        // Use base64 for images
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setPreview(null);
    }
  };

  const isPdf =
    preview && (preview.startsWith("blob:") || preview.endsWith(".pdf"));
  const renderPreview = () => {
    if (!preview) return null;

    if (isPdf) {
      return (
        <a href={preview} target="_blank" rel="noopener noreferrer">
          {fileName || "عرض الملف"}{" "}
          {/* Show file name if uploaded, else default label */}
        </a>
      );
    }

    return (
      <img
        src={preview}
        alt="Preview"
        width={60}
        height={60}
        style={{ objectFit: "cover", maxHeight: "60px" }}
      />
    );
  };

  return (
    <>
      <Box display="flex" gap={2}>
        <Controller
          name={input.data.id}
          control={control}
          render={({ field: { onChange, value = input.value } }) => {
            return (
              <TextField
                label={label}
                id={id}
                sx={(theme) => ({
                  backgroundColor:
                    variant === "outlined"
                      ? theme.palette.background.default
                      : "inherit",
                  ...(input.sx && input.sx),
                })}
                type="file"
                InputLabelProps={{ shrink: true }}
                {...register(id, !preview && input.pattern)}
                error={Boolean(errors[id])}
                helperText={errors[id]?.message}
                variant={variant}
                fullWidth
                {...(!noValue && { value })}
                accept={input.data.accept}
                onChange={(e) => {
                  onChange(e); // default handler
                  handleFileChange(e); // our handler
                }}
              />
            );
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

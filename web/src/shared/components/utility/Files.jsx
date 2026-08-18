import { Link as MuiLink, Box, Stack, Typography } from "@mui/material";
import { FaFile, FaFileImage, FaFilePdf } from "react-icons/fa";

function pathnameFor(value) {
  if (!value) return "";
  try {
    return decodeURIComponent(new URL(String(value), "http://asset.local").pathname);
  } catch {
    return String(value).split(/[?#]/, 1)[0];
  }
}

function extensionFor(value) {
  const pathname = pathnameFor(value);
  const filename = pathname.split("/").filter(Boolean).pop() || "";
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "";
}

export const getFileType = (fileUrl, fileName = "") => {
  const extension = extensionFor(fileUrl) || extensionFor(fileName);
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm"];
  const excelExtensions = ["xls", "xlsx", "csv"];

  if (imageExtensions.includes(extension)) return "image";
  if (extension === "pdf") return "pdf";
  if (videoExtensions.includes(extension)) return "video";
  if (excelExtensions.includes(extension)) return "excel";
  return "file";
};

export function getFileName(file = {}) {
  if (file.name || file.fileName) return file.name || file.fileName;
  const pathname = pathnameFor(file.url);
  return pathname.split("/").filter(Boolean).pop() || "document";
}

// Function to get appropriate icon
export const getFileTypeIcon = (fileUrl, theme, fileName = "") => {
  const fileType = getFileType(fileUrl, fileName);
  const iconStyle = {
    fontSize: "1.5rem",
    color: theme.palette.primary.main,
  };

  if (fileType === "pdf") return <FaFilePdf style={iconStyle} />;
  if (fileType === "image") return <FaFileImage style={iconStyle} />;
  return <FaFile style={iconStyle} />;
};

export function FilePreview({ file, imageMaxHeight = 240 }) {
  if (!file?.url) return null;
  const fileName = getFileName(file);
  const fileType = getFileType(file.url, fileName);

  if (fileType === "image") {
    return (
      <Box sx={{ mt: 1 }}>
        <Box
          component="img"
          src={file.url}
          alt={fileName}
          loading="lazy"
          sx={{
            display: "block",
            width: "100%",
            maxHeight: imageMaxHeight,
            objectFit: "contain",
            borderRadius: 1.5,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.default",
          }}
        />
      </Box>
    );
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
      {fileType === "pdf" ? <FaFilePdf /> : <FaFile />}
      <MuiLink
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        download={fileName}
        sx={{ overflowWrap: "anywhere", fontWeight: 600 }}
      >
        {fileType === "pdf" ? `Download ${fileName}` : `Open ${fileName}`}
      </MuiLink>
      {file.description ? (
        <Typography variant="caption" color="text.secondary">
          {file.description}
        </Typography>
      ) : null}
    </Stack>
  );
}

export const renderFilePreview = (file) => <FilePreview file={file} />;

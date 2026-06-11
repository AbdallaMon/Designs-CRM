import { Link as MuiLink, Box } from "@mui/material";
import { FaFileImage, FaFilePdf } from "react-icons/fa";
export const getFileType = (fileUrl) => {
  const extension = fileUrl.split(".").pop().toLowerCase();
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
  const videoExtensions = ["mp4", "mov", "avi", "mkv"];
  const excelExtensions = ["xls", "xlsx"];

  if (imageExtensions.includes(extension)) return "image";
  if (extension === "pdf") return "pdf";
  if (videoExtensions.includes(extension)) return "video";
  if (excelExtensions.includes(extension)) return "excel";
  return "";
};

// Function to get appropriate icon
export const getFileTypeIcon = (fileUrl, theme) => {
  const fileType = getFileType(fileUrl);
  const iconStyle = {
    fontSize: "1.5rem",
    color: theme.palette.primary.main,
  };

  return fileType === "pdf" ? (
    <FaFilePdf style={iconStyle} />
  ) : (
    <FaFileImage style={iconStyle} />
  );
};

export const renderFilePreview = (file) => {
  const fileType = getFileType(file.url);

  if (fileType === "image") {
    return (
      <Box sx={{ mt: 1 }}>
        <img
          src={file.url}
          alt={file.name}
          style={{
            maxWidth: "100%",
            maxHeight: "200px",
            objectFit: "contain",
            borderRadius: "4px",
          }}
        />
      </Box>
    );
  }
  return (
    <Box sx={{ mt: 1 }}>
      <MuiLink href={file.url} target="_blank" rel="noopener noreferrer">
        Open {fileType.toUpperCase()} File
      </MuiLink>
    </Box>
  );
};

"use client";

import { Box, Typography } from "@mui/material";
import {
  FaFileAlt,
  FaFileImage,
  FaFilePdf,
  FaFileVideo,
  FaFileAudio,
} from "react-icons/fa";

// ===== File icon =====
const renderFileIcon = (mimeType) => {
  if (!mimeType) return <FaFileAlt size={16} />;

  if (mimeType.startsWith("image/"))
    return <FaFileImage size={16} color="#4CAF50" />;
  if (mimeType.startsWith("video/"))
    return <FaFileVideo size={16} color="#2196F3" />;
  if (mimeType.startsWith("audio/"))
    return <FaFileAudio size={16} color="#FF9800" />;
  if (mimeType === "application/pdf")
    return <FaFilePdf size={16} color="#F44336" />;

  return <FaFileAlt size={16} color="#757575" />;
};

export function PinnedMessagePreview({ message }) {
  const hasFile = message?.fileUrl && message?.type !== "TEXT";
  const hasContent = message?.content && message.content.trim() !== "";

  if (hasFile && hasContent) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {renderFileIcon(message.fileMimeType)}
          <Typography
            variant="caption"
            sx={{ fontStyle: "italic", color: "text.secondary" }}
          >
            {message.fileName || "File"}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "text.primary" }}>
          {message.content}
        </Typography>
      </Box>
    );
  }

  if (hasFile) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {renderFileIcon(message.fileMimeType)}
        <Typography variant="body2" sx={{ fontStyle: "italic" }}>
          {message.fileName || "File"}
        </Typography>
      </Box>
    );
  }

  if (hasContent) {
    return (
      <Typography variant="body2" sx={{ color: "text.primary" }}>
        {message.content}
      </Typography>
    );
  }

  return (
    <Typography
      variant="body2"
      sx={{ fontStyle: "italic", color: "text.secondary" }}
    >
      Message
    </Typography>
  );
}

export default PinnedMessagePreview;

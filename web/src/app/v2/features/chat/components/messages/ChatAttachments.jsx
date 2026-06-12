"use client";

import { Box, IconButton, Link, Stack, Typography } from "@mui/material";
import { FaDownload, FaFile } from "react-icons/fa";
import { useT } from "@/app/v2/lib/i18n";

/**
 * Lightweight v2 attachment renderer (replaces the legacy MediaRender/RenderListOfFiles).
 * Preserves behavior: images render inline, video/audio use native players, other files
 * show a name + download link. `attachments` items carry { fileUrl, fileName,
 * fileMimeType, thumbnailUrl, content }.
 */
function isImage(mime) { return mime?.startsWith("image/"); }
function isVideo(mime) { return mime?.startsWith("video/"); }
function isAudio(mime) { return mime?.startsWith("audio/"); }

function AttachmentItem({ attachment }) {
  const { t } = useT();
  const { fileUrl, fileName, fileMimeType, thumbnailUrl } = attachment || {};
  if (!fileUrl) return null;

  if (isImage(fileMimeType)) {
    return (
      <Box
        component="a"
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ display: "block", maxWidth: 320 }}
      >
        <Box
          component="img"
          src={thumbnailUrl || fileUrl}
          alt={fileName || "image"}
          sx={{ width: "100%", borderRadius: 1, display: "block" }}
        />
      </Box>
    );
  }
  if (isVideo(fileMimeType)) {
    return <Box component="video" src={fileUrl} controls sx={{ maxWidth: 360, borderRadius: 1 }} />;
  }
  if (isAudio(fileMimeType)) {
    return <Box component="audio" src={fileUrl} controls sx={{ width: 260 }} />;
  }
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      sx={{ p: 1, borderRadius: 1, bgcolor: "action.hover" }}
    >
      <FaFile />
      <Link href={fileUrl} target="_blank" rel="noopener noreferrer" sx={{ flex: 1, minWidth: 0 }} noWrap>
        {fileName || t("chat.attachment.file", "ملف")}
      </Link>
      <IconButton size="small" component="a" href={fileUrl} download>
        <FaDownload size={14} />
      </IconButton>
    </Stack>
  );
}

export function ChatAttachments({ attachments = [] }) {
  if (!attachments?.length) return null;
  return (
    <Stack gap={1}>
      {attachments.map((att, i) => (
        <Box key={att.id ?? att.fileUrl ?? i}>
          <AttachmentItem attachment={att} />
          {att.content && (
            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {att.content}
            </Typography>
          )}
        </Box>
      ))}
    </Stack>
  );
}

export default ChatAttachments;

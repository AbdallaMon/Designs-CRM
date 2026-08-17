import { FILE_TYPE_CONFIG } from "@/app/helpers/constants";
import { FaFile } from "react-icons/fa";

export function getFileConfig(mimeType) {
  return (
    FILE_TYPE_CONFIG[mimeType] || {
      icon: FaFile,
      color: "#757575",
      label: "File",
    }
  );
}
export async function isInCache(url) {
  // Private signed media must never be persisted in Cache Storage. The browser's
  // ordinary HTTP cache is controlled by the response's private max-age header.
  return Boolean(url) && false;
}

export function isImage(mime) {
  return mime?.startsWith("image/");
}
export function isVideo(mime) {
  return mime?.startsWith("video/");
}
export function isAudio(mime) {
  return mime?.startsWith("audio/");
}
export function isPdf(mime) {
  return mime === "application/pdf";
}
export function isDOCX(mime) {
  return (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword"
  );
}

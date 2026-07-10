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
  try {
    if (!url || !("caches" in window)) return false;

    const candidates = new Set();

    try {
      const u = new URL(url, window.location.origin);
      candidates.add(u.href);
      candidates.add(u.pathname + u.search);
      candidates.add(u.pathname);
    } catch {
      candidates.add(url);
      try {
        const abs = new URL(url, window.location.origin);
        candidates.add(abs.href);
        candidates.add(abs.pathname + abs.search);
        candidates.add(abs.pathname);
      } catch {}
    }

    for (const c of candidates) {
      const hit = await caches.match(c);
      if (hit) return true;
    }
    return false;
  } catch {
    return false;
  }
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

import {
  Failed,
  Success,
} from "@/app/UiComponents/feedback/loaders/toast/ToastUpdate";
import { toast } from "react-toastify";

export async function uploadInChunks(file, setProgress, setOverlay, isClient) {
  const toastId = toast.loading("Uploading");
  const id = toastId;
  try {
    const chunkSize = 1 * 1024 * 1024; // 1MB
    const totalChunks = Math.ceil(file.size / chunkSize);
    let finalPayload = null;

    if (setOverlay) {
      setOverlay(true);
    }

    for (let i = 0; i < totalChunks; i++) {
      const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);

      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("filename", file.name);
      formData.append("chunkIndex", i);
      formData.append("totalChunks", totalChunks);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/${
          isClient ? "client/upload-chunk" : "utility/upload-chunk"
        }`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const json = await res.json();
      if (json.url) {
        finalPayload = {
          url: json.url,
          thumbnailUrl: json.thumbnailUrl || null,
          fileName: json.fileName || file.name,
          fileSize: json.fileSize || file.size,
          fileMimeType: json.fileMimeType || file.type || null,
        };
      }

      // ✅ update progress
      const percent = Math.round(((i + 1) / totalChunks) * 100);
      setProgress(percent);
    }
    if (setOverlay) {
      setOverlay(false);
    }
    toast.update(id, Success("Uploaded successfully"));

    return {
      thumbnailUrl: finalPayload.thumbnailUrl,
      url: finalPayload.url,
      status: finalPayload.url && 200,
      ...finalPayload,
    };
  } catch (e) {
    if (setOverlay) {
      setOverlay(false);
    }
    toast.update(id, Failed("Upload failed"));
  }
}

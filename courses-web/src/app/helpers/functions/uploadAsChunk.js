import {
  Failed,
  Success,
} from "@/shared/components/feedback/loaders/toast/ToastUpdate";
import { toast } from "react-toastify";
import { apiRequest } from "./apiClient";

export async function uploadInChunks(file, setProgress, setOverlay) {
  const toastId = toast.loading("Uploading");
  try {
    const chunkSize = 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadSessionId =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let finalPayload = null;

    setOverlay?.(true);
    for (let index = 0; index < totalChunks; index += 1) {
      const chunk = file.slice(index * chunkSize, (index + 1) * chunkSize);
      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("filename", file.name);
      formData.append("chunkIndex", index);
      formData.append("totalChunks", totalChunks);
      formData.append("uploadSessionId", uploadSessionId);

      const response = await apiRequest("files/chunks", {
        method: "POST",
        body: formData,
      });
      const envelope = await response.json();
      if (!response.ok) {
        throw new Error(envelope?.message || "FILE_UPLOAD_ERROR");
      }
      const payload = envelope?.data ?? envelope;
      if (payload.url) {
        finalPayload = {
          url: payload.url,
          thumbnailUrl: payload.thumbnailUrl || null,
          fileName: payload.fileName || file.name,
          fileSize: payload.fileSize || file.size,
          fileMimeType: payload.fileMimeType || file.type || null,
        };
      }
      setProgress?.(Math.round(((index + 1) / totalChunks) * 100));
    }

    setOverlay?.(false);
    toast.update(toastId, Success("Uploaded successfully"));
    return {
      thumbnailUrl: finalPayload?.thumbnailUrl ?? null,
      url: finalPayload?.url ?? null,
      status: finalPayload?.url ? 200 : false,
      ...(finalPayload ?? {}),
    };
  } catch {
    setOverlay?.(false);
    toast.update(toastId, Failed("Upload failed"));
    return { status: false, url: null, thumbnailUrl: null };
  }
}

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
    let finalFileUrl;
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
          isClient ? "client/upload" : "utility/upload-chunk"
        }`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const json = await res.json();
      console.log(json, "json");
      if (json.url) {
        finalFileUrl = json.url;
      }

      // ✅ update progress
      const percent = Math.round(((i + 1) / totalChunks) * 100);
      setProgress(percent);
    }
    console.log(finalFileUrl, "finalFileUrl");
    if (setOverlay) {
      setOverlay(false);
    }
    toast.update(id, Success("Uploaded successfully"));

    return { url: finalFileUrl, status: finalFileUrl && 200 };
  } catch (e) {
    if (setOverlay) {
      setOverlay(false);
    }
    toast.update(id, Failed("Upload failed"));
  }
}

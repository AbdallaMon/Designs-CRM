import { Success } from "@/app/UiComponents/feedback/loaders/toast/ToastUpdate";
import { toast } from "react-toastify";

export async function uploadInChunks(file) {
  const toastId = toast.loading("Uploading");
  const id = toastId;
  try {
    const chunkSize = 1 * 1024 * 1024; // 1MB
    const totalChunks = Math.ceil(file.size / chunkSize);
    let finalFileUrl;

    for (let i = 0; i < totalChunks; i++) {
      const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);

      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("filename", file.name);
      formData.append("chunkIndex", i);
      formData.append("totalChunks", totalChunks);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/utility/upload-chunk`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const json = await res.json();
      console.log(json, "json");
      console.log(`Chunk ${i + 1}/${totalChunks}:`, json.message);
      if (json.url) {
        finalFileUrl = json.url;
      }
    }
    await toast.update(id, Success("Uploaded succssffully"));

    return { url: finalFileUrl, status: finalFileUrl && 200 };
    console.log("✅ All chunks sent!");
  } catch (e) {
    await toast.update(id, Error("Upload failed"));
  }
}

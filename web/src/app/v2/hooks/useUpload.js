"use client";
import { useState } from "react";
import apiFetch from "../lib/api/ApiFetch";

export function useUpload({ isClient = false, onUploadStart, onUploadEnd }) {
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [uploadSpeed, setUploadSpeed] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  function uploadFile(file) {}
  async function uploadAsChunk({ file, withThumbnail = false }) {
    const chunkSize = 1 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadSessionId = Date.now() + "-" + file.name;
    let chunkIndex = 0;
    setIsUploading(true);
    if (onUploadStart) {
      onUploadStart();
    }
    while (true) {
      try {
        const res = await uploadAChunk({
          file,
          chunkIndex: chunkIndex,
          chunkSize,
          totalChunks,
          withThumbnail: progress === 0 && withThumbnail, // only create thumbnail for the first chunk
          uploadSessionId,
        });
        setFileName(file.name);
        console.log({ res, "res from chunk upload": res });
        if (res) {
          if (res.data.chunkIndex) {
            chunkIndex = res.data.chunkIndex;
            const percent = Math.round(((chunkIndex + 1) / totalChunks) * 100);
            setProgress(percent);
          }
          if (res.data.uploadSpeed) {
            setUploadSpeed(res.data.uploadSpeed);
          }
          if (res.data.completed) {
            setProgress(100);
            setIsUploading(false);
            if (onUploadEnd) {
              // add a small delay to allow users to see the 100% progress before closing the overlay
              setTimeout(() => {
                onUploadEnd();
              }, 500);
            }
            return {
              thumbnailUrl: res.data.thumbnailUrl,
              url: res.data.url,
              status: res.data.url && 200,
              fileName: res.data.fileName || file.name,
              fileSize: res.data.fileSize || file.size,
              fileMimeType: res.data.fileMimeType || file.type || null,
            };
          }
        }
      } catch (e) {
        console.error("Upload failed", e);
        setIsUploading(false);
        break;
      }
    }
  }
  async function uploadAChunk({
    file,
    chunkIndex,
    chunkSize,
    totalChunks,
    withThumbnail = false,
    uploadSessionId,
  }) {
    try {
      const chunk = file.slice(
        chunkIndex * chunkSize,
        (chunkIndex + 1) * chunkSize,
      );
      console.log({ chunk }, "Uploading chunk");
      const formData = new FormData();
      formData.append("file", chunk, file.name);
      formData.append("filename", file.name);
      formData.append("fileType", file.type || "");
      formData.append("chunkIndex", chunkIndex);
      formData.append("totalChunks", totalChunks);
      formData.append("chunkSize", chunkSize);
      formData.append("uploadSessionId", uploadSessionId);

      if (withThumbnail) {
        formData.append("createThumbnail", "true");
      }

      const client = isClient ? apiFetch.public : apiFetch;
      const slug = isClient ? "files/client/chunks" : "files/chunks";
      const res = await client.post(slug, formData, false, null, true);
      return res;
    } catch (e) {
      console.error("Chunk upload failed", e);
      throw e;
    }
  }
  return { uploadAsChunk, progress, fileName, uploadSpeed, isUploading };
}

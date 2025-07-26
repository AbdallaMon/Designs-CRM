export async function uploadInChunks(file) {
  const chunkSize = 1 * 1024 * 1024; // 1MB
  const totalChunks = Math.ceil(file.size / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);

    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("filename", file.name);
    formData.append("chunkIndex", i);
    formData.append("totalChunks", totalChunks);

    const res = await fetch("http://yourdomain.com/api/upload-chunk", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const json = await res.json();
    console.log(`Chunk ${i + 1}/${totalChunks}:`, json.message);
  }

  console.log("✅ All chunks sent!");
}

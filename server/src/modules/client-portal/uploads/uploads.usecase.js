// client-portal/uploads usecase — 🔒 FROZEN chunk-index/merge orchestration, relocated VERBATIM
// from the legacy `services/main/utility/uploadAsChunk.js` (via
// `client-portal/uploads/legacy/upload-as-chunk.js`).
//
// ⚠️ This handler WRITES THE HTTP RESPONSE ITSELF (`res.status().json()`) — the FE chunk
// mechanism depends on this exact status/JSON shape (progress `{ message }`, completion payload,
// and the ad-hoc 400/500 `{ error }` bodies). That response handling is preserved EXACTLY where
// and how it was; it is intentionally NOT re-enveloped into the v2 contract, and validation is
// intentionally NOT hoisted to Zod (that would change the frozen 400 behavior). Only the
// filesystem I/O is delegated to uploads.repo.js.
//
// Importing uploads.repo.js here (statically) is what triggers the repo's import-time
// `mkdirSync` on the FIRST upload request (the controller lazy-imports this usecase), preserving
// the legacy timing exactly.
import path from "path";
import mime from "mime-types";
import { v4 as uuidv4 } from "uuid";

import { finalDir, uploadsRepository } from "./uploads.repo.js";

export async function uploadAsChunk(req, res, tmpDir) {
  try {
    const { filename, chunkIndex, totalChunks } = req.body;

    const originalName = path.basename(filename);
    const chunkNumber = Number.parseInt(chunkIndex, 10);
    const total = Number.parseInt(totalChunks, 10);

    if (!req.file?.path) {
      return res
        .status(400)
        .json({ error: "No chunk uploaded (req.file missing)" });
    }
    if (Number.isNaN(chunkNumber) || Number.isNaN(total)) {
      return res.status(400).json({ error: "Invalid chunkIndex/totalChunks" });
    }

    const chunkFilePath = path.join(
      tmpDir,
      `${originalName}.part${chunkNumber}`
    );
    uploadsRepository.renameChunk(req.file.path, chunkFilePath);

    // Not last chunk
    if (chunkNumber + 1 !== total) {
      return res.json({ message: `✅ Chunk ${chunkNumber + 1} received` });
    }

    // Last chunk => merge
    const uniqueFilename = `${uuidv4()}${path.extname(originalName)}`;
    const finalPath = path.join(finalDir, uniqueFilename);

    await uploadsRepository.mergeChunksToFile({
      tmpDir,
      originalName,
      totalChunks: total,
      finalPath,
    });

    const fileUrl = `/uploads/${uniqueFilename}`;
    const stat = uploadsRepository.statFile(finalPath);
    const fileSize = stat.size;
    const fileMimeType = mime.lookup(uniqueFilename) || null;

    const thumbnailUrl = await uploadsRepository.tryMakeThumbnail({
      finalPath,
      uniqueFilename,
    });

    return res.json({
      message: "✅ Upload complete",
      url: fileUrl,
      thumbnailUrl, // ✅ will be /uploads/thumb/<thumbName>
      fileName: uniqueFilename,
      fileSize,
      fileMimeType,
    });
  } catch (e) {
    console.log("uploadAsChunk error:", e);
    return res.status(500).json({ error: "Upload failed" });
  }
}

// client-portal/uploads controller — thin pass-through to the 🔒 FROZEN upload handlers.
// The legacy `uploadAsChunk(req, res, tmpDir)` and `uploadAsHttp(req, res)` write the HTTP
// response THEMSELVES (status, JSON, the upload-progress shape the FE depends on). We do NOT
// re-envelope or alter them — wrapping them in the v2 contract would change the chunk
// mechanism's observable output, which is forbidden. They are invoked via lazy adapters so no
// logic is duplicated. Errors mirror legacy's own try/catch shape.
import { chunkTmpDir } from "./uploads.middleware.js";
import { uploadAsHttp } from "../../../infra/upload/ftp-upload.js";

// uploadAsChunk is imported LAZILY on purpose: importing uploads.usecase.js pulls
// uploads.repo.js, whose module-load `mkdirSync` on hardcoded prod paths must run on
// the FIRST upload request (not at boot) — the legacy timing this dynamic import
// preserves exactly. Do NOT convert this to a static top-level import.
const loadUploadAsChunk = (...args) =>
  import("./uploads.usecase.js").then((m) => m.uploadAsChunk(...args));

export class UploadsController {
  // POST /upload-chunk — frozen chunked upload. Handler owns the response.
  uploadChunk = async (req, res) => {
    try {
      return await loadUploadAsChunk(req, res, chunkTmpDir);
    } catch (error) {
      // Preserve the legacy error shape exactly (prose stays internal to the FROZEN path —
      // the FE already handles this shape; re-coding it would alter the frozen contract).
      console.error("Error in /upload-chunk:", error);
      res
        .status(500)
        .json({ message: "Error uploading chunk", error: error.message });
    }
  };

  // POST /api/upload — frozen single in-memory HTTP upload. Handler owns the response.
  uploadHttp = async (req, res) => {
    return uploadAsHttp(req, res);
  };
}

export const uploadsController = new UploadsController();

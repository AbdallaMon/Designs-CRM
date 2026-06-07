// client-portal/uploads route — PUBLIC client file uploads. Legacy `routes/client/uploads.js`
// (`POST /upload-chunk`, `POST /api/upload`), mounted PATHLESS under `/client`. Mounted under
// v2 at `/v2/client/upload-chunk` and `/v2/client/api/upload` (paths preserved 1:1).
//
// PUBLIC BY DESIGN — clients upload lead attachments / signatures before any login session,
// exactly like legacy and `/files/client/*`. 🔒 The chunk mechanism + the underlying frozen
// handlers are UNCHANGED; only the multer wiring + handler invocation are relocated.
//
// NOTE: this is the FROZEN-handler client upload surface. The separate `/v2/files/client/*`
// (upload module) is a re-implemented storage provider — a DIFFERENT mechanism — so this
// surface is migrated independently to preserve the frozen behavior the website relies on.
//
// The third legacy endpoint (`POST /upload` → `uploadFiles`) was COMMENTED OUT in legacy
// (dead) and is intentionally not mapped.
import { Router } from "express";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { uploadsController as c } from "./uploads.controller.js";
import { chunkUpload, memoryUpload } from "./uploads.middleware.js";

const router = Router();

// POST /v2/client/upload-chunk
router.post(
  "/upload-chunk",
  chunkUpload.single("chunk"),
  asyncHandler(c.uploadChunk),
);

// POST /v2/client/api/upload
router.post(
  "/api/upload",
  memoryUpload.single("file"),
  asyncHandler(c.uploadHttp),
);

export { router as clientUploadsRouter };

// client-portal/uploads compatibility route. Legacy `routes/client/uploads.js`
// (`POST /upload-chunk`, `POST /api/upload`), mounted PATHLESS under `/client`. Mounted under
// v2 at `/v2/client/upload-chunk` and `/v2/client/api/upload` (paths preserved 1:1).
//
// This remaining endpoint is NOT public: it accepts only a short-lived INTERNAL_PDF
// capability whose subject must exactly match the uploaded filename. Public funnel files
// use the scoped `/v2/files/client/*` routes instead.
//
// The compatibility path writes through the same private local storage provider as every
// other upload; the old public_html/FTP behavior is no longer present.
//
// The third legacy endpoint (`POST /upload` → `uploadFiles`) was COMMENTED OUT in legacy
// (dead) and is intentionally not mapped.
import { Router } from "express";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { uploadsController } from "./uploads.controller.js";
import { memoryUpload } from "./uploads.middleware.js";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";

const router = Router();

// POST /v2/client/upload-chunk
router.post(
  "/api/upload",
  AuthMiddleware.requireSpecialChecker(uploadsController.authorizeInternalUpload),
  memoryUpload.single("file"),
  asyncHandler(uploadsController.uploadHttp),
);

export { router as clientUploadsRouter };

import { Router } from "express";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { uploadController } from "./upload.controller.js";
import { UploadMiddleware } from "./upload.middleware.js";
import { uploadSchemas } from "./upload.validation.js";
import { PERMISSIONS } from "@dms/shared";
import {
  publicUploadCapabilityLimiter,
  publicUploadLimiter,
} from "./upload.rate-limiter.js";

const uploadRouter = Router();

// Authed upload endpoints: require auth + the upload permission code (granted to
// every role today). The `/client/*` endpoints below stay PUBLIC — do not gate.
uploadRouter.post(
  "/single",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requirePermissions([PERMISSIONS.UPLOAD.FILE_UPLOAD]),
  UploadMiddleware.singleFile("file"),
  validate(uploadSchemas.singleFile),
  asyncHandler(uploadController.uploadSingleFile),
);

uploadRouter.post(
  "/chunks",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requirePermissions([PERMISSIONS.UPLOAD.FILE_UPLOAD]),
  // Frontend (frozen uploadInChunks) posts the part under field name "chunk" — must match.
  UploadMiddleware.chunkFile("chunk"),
  validate(uploadSchemas.chunkUpload),
  asyncHandler(uploadController.uploadAsChunks),
);

uploadRouter.post(
  "/client/capabilities",
  publicUploadCapabilityLimiter,
  validate(uploadSchemas.publicCapability),
  asyncHandler(uploadController.issuePublicCapability),
);

uploadRouter.post(
  "/client/single",
  publicUploadLimiter,
  validate(uploadSchemas.publicAccessQuery, "query"),
  AuthMiddleware.requireSpecialChecker(uploadController.authorizePublicUpload),
  UploadMiddleware.singleFile("file", true),
  validate(uploadSchemas.singleFile),
  asyncHandler(uploadController.uploadSingleFile),
);

uploadRouter.post(
  "/client/chunks",
  publicUploadLimiter,
  validate(uploadSchemas.publicAccessQuery, "query"),
  AuthMiddleware.requireSpecialChecker(uploadController.authorizePublicUpload),
  UploadMiddleware.chunkFile("chunk", undefined, true),
  validate(uploadSchemas.chunkUpload),
  asyncHandler(uploadController.uploadAsChunks),
);

export { uploadRouter };

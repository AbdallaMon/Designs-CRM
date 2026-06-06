import { Router } from "express";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { uploadController } from "./upload.controller.js";
import { UploadMiddleware } from "./upload.middleware.js";
import { uploadSchemas } from "./upload.validation.js";
import { PERMISSIONS } from "@dms/shared";

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
  UploadMiddleware.chunkFile("file"),
  //   validate(uploadSchemas.chunkUpload),
  asyncHandler(uploadController.uploadAsChunks),
);

uploadRouter.post(
  "/client/single",
  UploadMiddleware.singleFile("file", true),
  validate(uploadSchemas.singleFile),
  asyncHandler(uploadController.uploadSingleFile),
);

uploadRouter.post(
  "/client/chunks",
  UploadMiddleware.chunkFile("file", undefined, true),
  validate(uploadSchemas.chunkUpload),
  asyncHandler(uploadController.uploadAsChunks),
);

export { uploadRouter };

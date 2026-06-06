import { Router } from "express";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { uploadController } from "./upload.controller.js";
import { UploadMiddleware } from "./upload.middleware.js";
import { uploadSchemas } from "./upload.validation.js";

const uploadRouter = Router();

uploadRouter.post(
  "/single",
  AuthMiddleware.requireAuth,
  UploadMiddleware.singleFile("file"),
  validate(uploadSchemas.singleFile),
  asyncHandler(uploadController.uploadSingleFile),
);

uploadRouter.post(
  "/chunks",
  AuthMiddleware.requireAuth,
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

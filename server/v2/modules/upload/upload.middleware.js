import multer from "multer";
import { env } from "../../config/env.js";
import {
  ensureDir,
  buildUniqueFilename,
} from "../../infra/upload/local-disk-storage.provider.js";

const DEFAULT_MAX_FILE_SIZE = Number(env.MAX_FILE_SIZE) || 1000000000;
const DEFAULT_MAX_FILE_SIZE_FOR_CLIENT =
  Number(env.MAX_FILE_SIZE_FOR_CLIENT) || 100000000;
const DEFAULT_TEMP_DIR = env.TEMP_UPLOAD_DIR;

function createBaseMulterOptions(isClientUpload = false) {
  return {
    limits: {
      fileSize: isClientUpload
        ? DEFAULT_MAX_FILE_SIZE_FOR_CLIENT
        : DEFAULT_MAX_FILE_SIZE,
    },
    fileFilter: (req, file, cb) => {
      cb(null, true);
    },
  };
}

class UploadMiddleware {
  static singleFile(fieldName = "file", isClientUpload = false) {
    return multer({
      storage: multer.memoryStorage(),
      ...createBaseMulterOptions(isClientUpload),
    }).single(fieldName);
  }

  static chunkFile(
    fieldName = "chunk",
    tempDir = DEFAULT_TEMP_DIR,
    isClientUpload = false,
  ) {
    ensureDir(tempDir);

    return multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, tempDir);
        },
        filename: (req, file, cb) => {
          cb(null, buildUniqueFilename(file.originalname || fieldName));
        },
      }),
      ...createBaseMulterOptions(isClientUpload),
    }).single(fieldName);
  }
}

export { UploadMiddleware };

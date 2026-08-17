import multer from "multer";
import { env } from "../../../config/env.js";

export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_FOR_CLIENT, files: 1 },
});

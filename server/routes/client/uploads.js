import express from "express";
const router = express.Router();
import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import {
  uploadAsHttp /*, uploadFiles*/,
} from "../../services/main/utility/utility.js";
import { uploadAsChunk } from "../../services/main/utility/uploadAsChunk.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tmpDir = path.resolve(__dirname, "../tmp/chunks");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const upload = multer({ dest: tmpDir });

router.post("/upload-chunk", upload.single("chunk"), async (req, res) => {
  return uploadAsChunk(req, res, tmpDir);
});

// exact same endpoint as your code
router.post("/api/upload", upload.single("file"), uploadAsHttp);

// // kept commented, identical to your file
// router.post("/upload", async (req, res) => {
//   await uploadFiles(req, res);
// });

export default router;

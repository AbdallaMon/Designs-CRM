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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const finalDir = "/home/panel.dreamstudiio.com/public_html/uploads";
const tmpDir = path.resolve(__dirname, "tmp/chunks");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });

const chunkUpload = multer({ dest: tmpDir });
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", chunkUpload.single("chunk"), async (req, res) => {
  const { filename, chunkIndex, totalChunks } = req.body;
  const originalName = path.basename(filename);
  const chunkNumber = parseInt(chunkIndex);
  const chunkFilePath = path.join(tmpDir, `${originalName}.part${chunkNumber}`);

  fs.renameSync(req.file.path, chunkFilePath);

  if (chunkNumber + 1 === parseInt(totalChunks)) {
    const uniqueFilename = `${uuidv4()}${path.extname(originalName)}`;
    const finalPath = path.join(finalDir, uniqueFilename);
    const writeStream = fs.createWriteStream(finalPath);

    for (let i = 0; i < totalChunks; i++) {
      const partPath = path.join(tmpDir, `${originalName}.part${i}`);
      const data = fs.readFileSync(partPath);
      writeStream.write(data);
      fs.unlinkSync(partPath);
    }

    const fileUrl = process.env.ISLOCAL
      ? `${process.env.SERVER}/uploads/${uniqueFilename}`
      : `http://panel.dreamstudiio.com/uploads/${uniqueFilename}`;

    writeStream.end();
    writeStream.on("finish", () => {
      console.log(fileUrl, "fileUrl");
      return res.json({ message: "✅ Upload complete", url: fileUrl });
    });
  } else {
    res.json({ message: `✅ Chunk ${chunkNumber + 1} received` });
  }
});

// exact same endpoint as your code
router.post("/api/upload", upload.single("file"), uploadAsHttp);

// // kept commented, identical to your file
// router.post("/upload", async (req, res) => {
//   await uploadFiles(req, res);
// });

export default router;

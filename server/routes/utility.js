import express from "express";
import {
  getNotifications,
  getPagination,
  handlePrismaError,
  markLatestNotificationsAsRead,
  searchData,
  uploadFiles,
  verifyTokenUsingReq,
} from "../services/main/utility.js";

const router = express.Router();
const finalDir = "/home/panel.dreamstudiio.com/public_html/uploads";

import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tmpDir = path.resolve(__dirname, "tmp/chunks");

if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });
const upload = multer({ dest: tmpDir });

router.post("/upload-chunk", upload.single("chunk"), async (req, res) => {
  const { filename, chunkIndex, totalChunks } = req.body;
  const originalName = path.basename(filename);
  const chunkNumber = parseInt(chunkIndex);
  const chunkFilePath = path.join(tmpDir, `${originalName}.part${chunkNumber}`);

  fs.renameSync(req.file.path, chunkFilePath);

  // If last chunk, merge all
  if (chunkNumber + 1 === parseInt(totalChunks)) {
    const uniqueFilename = `${uuidv4()}${path.extname(originalName)}`;
    const finalPath = path.join(finalDir, uniqueFilename);
    const writeStream = fs.createWriteStream(finalPath);

    for (let i = 0; i < totalChunks; i++) {
      const partPath = path.join(tmpDir, `${originalName}.part${i}`);
      const data = fs.readFileSync(partPath);
      writeStream.write(data);
      fs.unlinkSync(partPath); // clean up chunk
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

// Search Route
router.get("/search", verifyTokenUsingReq, async (req, res) => {
  const searchBody = req.query;
  try {
    const data = await searchData(searchBody);
    res.status(200).json({ data });
  } catch (error) {
    console.error(`Error fetching data:`, error);
    res.status(500).json({ message: `error fetching data: ${error.message}` });
  }
});

router.post("/upload", verifyTokenUsingReq, async (req, res) => {
  await uploadFiles(req, res);
});

router.get("/notification/unread", async (req, res) => {
  const searchParams = req.query;
  const { limit = 9, skip = 1 } = getPagination(req);
  try {
    const { notifications, total } = await getNotifications(
      searchParams,
      limit,
      skip,
      true
    );
    const totalPages = Math.ceil(total / limit);
    if (!notifications) {
      return res.status(404).json({ message: "No new notifications" });
    }
    res.status(200).json({ data: notifications, totalPages, total });
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    res.status(500).json({ message: "Error getting notification" });
  }
});
router.post("/notification/users/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    await markLatestNotificationsAsRead(userId);
    res.status(200).json({ message: "Updated" });
  } catch (error) {
    handlePrismaError(res, error);
  }
});
export default router;

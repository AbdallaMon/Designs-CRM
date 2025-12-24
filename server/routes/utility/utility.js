import express from "express";
import {
  getCurrentUser,
  getNotifications,
  getPagination,
  handlePrismaError,
  markLatestNotificationsAsRead,
  searchData,
  uploadFiles,
  verifyTokenUsingReq,
} from "../../services/main/utility/utility.js";

const router = express.Router();

import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { uploadAsChunk } from "../../services/main/utility/uploadAsChunk.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tmpDir = path.resolve(__dirname, "../tmp/chunks");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const upload = multer({ dest: tmpDir });

router.post("/upload-chunk", upload.single("chunk"), async (req, res) => {
  return uploadAsChunk(req, res, tmpDir);
});

// Search Route
router.get("/search", verifyTokenUsingReq, async (req, res) => {
  const searchBody = req.query;
  try {
    const currentUser = await getCurrentUser(req);
    const data = await searchData(searchBody, currentUser);
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

import express from "express";
import {
  getNotifications,
  getPagination,
  handlePrismaError,
  markLatestNotificationsAsRead,
  searchData,
  uploadFiles,
  verifyTokenUsingReq,
} from "../services/utility.js";

const router = express.Router();

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

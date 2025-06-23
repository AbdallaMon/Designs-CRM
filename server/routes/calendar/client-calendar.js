import {
  getAvailableDays,
  getAvailableSlotsForDay,
  verifyAndExtractCalendarToken,
} from "../../services/main/calendarServices.js";
import express from "express";

const router = express.Router();

router.get("/meeting-data", async (req, res) => {
  try {
    const { token } = req.query;
    const tokenData = verifyAndExtractCalendarToken(token);
    res.status(200).json({
      message: "Meeting data fetched successfully",
      data: tokenData,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: "Error fetching meeting data",
      error: e.message || "Internal Server Error",
    });
  }
});
router.get("/available-days", async (req, res) => {
  try {
    const { month, token } = req.query;
    const tokenData = verifyAndExtractCalendarToken(token);
    const data = await getAvailableDays({
      month: month,
      //   userId: tokenData.adminId,
      userId: 1,
    });
    res.status(200).json({
      message: "Available days fetched successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: "Error fetching available days",
      error: e.message || "Internal Server Error",
    });
  }
});
router.get("/slots/:dayId", async (req, res) => {
  try {
    const { token } = req.query;
    const tokenData = verifyAndExtractCalendarToken(token);
    console.log(req.params, "req.params");
    const data = await getAvailableSlotsForDay({
      date: req.query.date,
      //   userId: tokenData.adminId,
      dayId: req.params.dayId,
      userId: 1,
    });
    res.status(200).json({
      message: "Available days fetched successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: "Error fetching available days",
      error: e.message || "Internal Server Error",
    });
  }
});
export default router;

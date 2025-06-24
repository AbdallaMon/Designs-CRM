import { Router } from "express";
import {
  getAvailableDays,
  getAvailableSlotsForDay,
  getCalendarDataForMonth,
  getRemindersForDay,
} from "../../services/main/calendarServices.js";
import {
  getCurrentUser,
  verifyTokenAndHandleAuthorization,
} from "../../services/main/utility.js";

const router = Router();

router.use((req, res, next) => {
  verifyTokenAndHandleAuthorization(req, res, next, "SHARED");
});

router.get("/available-days", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    let adminId = req.query.adminId;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      adminId = user.id;
    }
    const data = await getAvailableDays({
      month: req.query.month,
      adminId: adminId,
      role: isAdmin,
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
router.get("/slots", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    let adminId = req.query.adminId;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      adminId = user.id;
    }
    const data = await getAvailableSlotsForDay({
      date: req.query.date,
      adminId: adminId,
      role: isAdmin,
    });
    res.status(200).json({
      message: "Available days fetched successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: e.message || "Error fetching available slots",
      error: e.message || "Internal Server Error",
    });
  }
});

router.get("/dates/month", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    console.log(user, "user");
    const data = await getCalendarDataForMonth({
      year: req.query.year,
      month: req.query.month,
      userId: user.role === "STAFF" && user.id,
      adminId: req.query.isAdmin === "true" ? user.id : null,
    });
    res.status(200).json({
      message: "Available dates fetched successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: e.message || "Error fetching available dates",
      error: e.message || "Internal Server Error",
    });
  }
});
router.get("/dates/day", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    console.log(req.query.isAdmin, " req.query.isAdmin");
    const data = await getRemindersForDay({
      date: req.query.date,
      userId: user.role === "STAFF" && user.id,
      adminId: req.query.isAdmin === "true" && user.id,
    });
    res.status(200).json({
      message: "Available dates fetched successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: e.message || "Error fetching available dates",
      error: e.message || "Internal Server Error",
    });
  }
});
export default router;

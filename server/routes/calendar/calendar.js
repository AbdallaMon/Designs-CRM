// routes/sharedCalendarRoutes.js
import express from "express";
import {
  getAvailableDays,
  getAvailableSlotsForDay,
  createOrUpdateAvailableDay,
  createOrUpdateMultipleDays,
} from "./new-calendar.js";
import { getCurrentUser } from "../../services/main/utility/utility.js";
import {
  getCalendarDataForMonth,
  getRemindersForDay,
} from "../../services/main/calendar/calendarServices.js";

const router = express.Router();

// GET /shared/calendar/available-days
// returns { month, weeks: [ [day, day, ...7], ... ] }
router.get("/available-days", async (req, res) => {
  try {
    let { month, adminId, timezone, type } = req.query;
    const user = await getCurrentUser(req);

    const userId = user.id;
    if (!adminId || adminId === "undefined") {
      adminId = user.id;
    }
    const data = await getAvailableDays({
      month,
      adminId,
      userId,
      type: type || "ADMIN",
      timezone: timezone || "Asia/Dubai",
    });

    res.status(200).json({ data });
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ message: err.message || "Error loading calendar days" });
  }
});

// GET /shared/calendar/slots
router.get("/slots", async (req, res) => {
  try {
    let { date, adminId, dayId, timezone, type } = req.query;
    const user = await getCurrentUser(req);
    const userId = user.id;
    if (!adminId || adminId === "undefined") {
      adminId = user.id;
    }
    const slots = await getAvailableSlotsForDay({
      date,
      adminId,
      dayId,
      userId,
      timezone: timezone || "Asia/Dubai",
      type: type || "ADMIN",
    });

    res.status(200).json({ data: slots });
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ message: err.message || "Error loading slots for day" });
  }
});

// POST /shared/calendar/available-days   (single day)
router.post("/available-days", async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    const userId = user.id;
    const { date, fromHour, toHour, duration, breakMinutes } = req.body;
    const timezone = req.query.timezone || "Asia/Dubai";

    const day = await createOrUpdateAvailableDay({
      userId,
      date,
      fromTime: fromHour,
      toTime: toHour,
      duration,
      breakMinutes,
      timeZone: timezone,
    });

    res.status(200).json({ data: day });
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ message: err.message || "Error generating slots for day" });
  }
});

// POST /shared/calendar/available-days/multiple  (multi dates)
router.post("/available-days/multiple", async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    const userId = user.id;
    const { days, fromHour, toHour, duration, breakMinutes } = req.body;
    const timezone = req.query.timezone || "Asia/Dubai";

    const result = await createOrUpdateMultipleDays({
      userId,
      dates: days,
      fromTime: fromHour,
      toTime: toHour,
      duration,
      breakMinutes,
      timeZone: timezone,
    });

    res.status(200).json({ data: result });
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ message: err.message || "Error generating slots for days" });
  }
});

// DELETE /shared/calendar/days/:id
router.delete("/days/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.availableSlot.deleteMany({ where: { availableDayId: id } });
    await prisma.availableDay.delete({ where: { id } });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ message: err.message || "Error deleting available day" });
  }
});

// DELETE /shared/calendar/slots/:id
router.delete("/slots/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.availableSlot.delete({ where: { id } });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message || "Error deleting slot" });
  }
});

router.get("/dates/month", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const data = await getCalendarDataForMonth({
      year: req.query.year,
      month: req.query.month,
      userId:
        user.role !== "ADMIN" &&
        user.role !== "SUPER_ADMIN" &&
        !user.isSuperSales &&
        user.id,
      adminId: req.query.isAdmin === "true" ? user.id : null,
      isSuperSales: user.isSuperSales,
      superSalesId: user.id,
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
    const data = await getRemindersForDay({
      date: req.query.date,
      userId: user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.id,
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

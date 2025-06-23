import { Router } from "express";
import {
  createAvailableDatesForMoreThanOneDay,
  createAvailableDay,
  deleteASlot,
  getAvailableDays,
  getAvailableSlotsForDay,
  updateAvailableDay,
  verifyAndExtractCalendarToken,
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

    const data = await getAvailableDays({
      month: req.query.month,
      userId: user.id,
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
    const data = await getAvailableSlotsForDay({
      date: req.query.date,
      userId: user.id,
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
router.post("/available-days", async (req, res) => {
  try {
    const { date, fromHour, toHour, duration, breakMinutes } = req.body;
    const user = await getCurrentUser(req);
    console.log(date, "submit date?");
    const data = await createAvailableDay({
      date,
      fromHour,
      toHour,
      duration,
      breakMinutes,
      userId: user.id,
    });
    res.status(200).json({
      message: "Available day created successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: "Error creating available day",
      error: e.message || "Internal Server Error",
    });
  }
});
router.put("/available-days/:dayId", async (req, res) => {
  try {
    const { dayId } = req.params;
    const { date, fromHour, toHour, duration, breakMinutes } = req.body;
    const user = await getCurrentUser(req);
    const data = await updateAvailableDay({
      dayId,
      date,
      fromHour,
      toHour,
      duration,
      breakMinutes,
      userId: user.id,
    });
    res.status(200).json({
      message: "Available day updated successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: "Error updating available day",
      error: e.message || "Internal Server Error",
    });
  }
});
router.post("/available-days/multiple", async (req, res) => {
  try {
    const { days, fromHour, toHour, duration, breakMinutes } = req.body;
    const user = await getCurrentUser(req);
    console.log(req.body, "req.body days?");
    const data = await createAvailableDatesForMoreThanOneDay({
      userId: user.id,
      days,
      fromHour,
      toHour,
      duration,
      breakMinutes,
    });
    res.status(200).json({
      message: "Available days created successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: "Error creating available days",
      error: e.message || "Internal Server Error",
    });
  }
});
router.post("/add-custom/:dayId", async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    const user = await getCurrentUser(req);

    res.status(200).json({
      message: "Custom available day created successfully",
      data: "",
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: "Error creating custom available day",
      error: e.message || "Internal Server Error",
    });
  }
});
router.delete("/slots/:slotId", async (req, res) => {
  try {
    const { slotId } = req.params;
    const data = await deleteASlot({
      slotId,
    });
    res.status(200).json({
      message: "Slot deleted successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: "Error deleting available slot",
      error: e.message || "Internal Server Error",
    });
  }
});

export default router;

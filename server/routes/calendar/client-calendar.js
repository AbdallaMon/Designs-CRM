import {
  bookAMeeting,
  getAvailableDays,
  getAvailableSlotsForDay,
  verifyAndExtractCalendarToken,
} from "../../services/main/calendarServices.js";
import express from "express";

const router = express.Router();

router.get("/meeting-data", async (req, res) => {
  try {
    const { token } = req.query;
    const tokenData = await verifyAndExtractCalendarToken(token);
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
    const tokenData = await verifyAndExtractCalendarToken(token);
    const data = await getAvailableDays({
      month: month,
      ...tokenData,
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
    const tokenData = await verifyAndExtractCalendarToken(token);
    const data = await getAvailableSlotsForDay({
      date: req.query.date,
      dayId: req.params.dayId,
      ...tokenData,
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
router.post("/book", async (req, res) => {
  try {
    const tokenData = await verifyAndExtractCalendarToken(req.query.token);
    const data = await bookAMeeting({
      ...req.body,
      ...tokenData,
    });

    res.status(200).json({
      message: "Slot booked successfully",
      data: data,
    });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({
      message: e.message,
      error: e.message || "Internal Server Error",
    });
  }
});

router.get("/timezones", async (req, res) => {
  const groupedTimezoneOptions = Intl.supportedValuesOf("timeZone")
    .map((tz) => {
      const [region = "Other", city = ""] = tz.split("/");
      const label = tz.replace("_", " ");
      const currentTime = new Date().toLocaleTimeString("en-US", {
        timeZone: tz,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      return {
        group: region,
        label: `${label} (${currentTime})`,
        value: tz,
      };
    })
    .sort(
      (a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label)
    );
  res.status(200).json({
    message: "Time zones fetched successfully",
    data: groupedTimezoneOptions,
  });
});
export default router;

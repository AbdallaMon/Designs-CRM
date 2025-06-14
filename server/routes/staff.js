import { Router } from "express";
import { verifyTokenAndHandleAuthorization } from "../services/utility.js";
import { getCallReminders } from "../services/staffServices.js";

const router = Router();

router.use((req, res, next) => {
  verifyTokenAndHandleAuthorization(req, res, next, "STAFF");
});

router.get("/dashboard/latest-calls", async (req, res) => {
  try {
    const searchParams = req.query;

    const data = await getCallReminders(searchParams);
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching client lead details:", error);
    res.status(500).json({
      message:
        error.message ||
        "An error occurred while fetching client lead details.",
    });
  }
});

export default router;

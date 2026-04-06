import { Router } from "express";
import {
  createBookingLeadController,
  getBookingLeadController,
  submitBookingLeadController,
  updateBookingLeadController,
} from "./booking-leads.controller.js";

const router = Router();

router.post("/", createBookingLeadController);
router.get("/:leadId", getBookingLeadController);
router.patch("/:leadId", updateBookingLeadController);
router.put("/:leadId/submit", submitBookingLeadController);

export default router;

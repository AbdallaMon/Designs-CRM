import { Router } from "express";
import { bookingLeadsRouter } from "../modules/leads/client/booking-lead/booking-leads.routes.js";

const router = Router();

router.use("/client/booking-leads", bookingLeadsRouter);

export default router;

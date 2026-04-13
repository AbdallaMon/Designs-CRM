import { Router } from "express";
import { bookingLeadsRouter } from "../modules/leads/client/booking-lead/booking-leads.routes.js";
import { telegramRouter } from "../modules/telegram/auth/telegram.routes.js";
import { chatRouter } from "../modules/chat/chat.routes.js";

const router = Router();

router.use("/client/booking-leads", bookingLeadsRouter);
router.use("/telegram", telegramRouter);
router.use("/chat", chatRouter);

export default router;

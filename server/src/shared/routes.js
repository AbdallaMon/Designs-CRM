import { Router } from "express";
import { bookingLeadsRouter } from "../modules/leads/client/booking-lead/booking-leads.routes.js";
import { telegramRouter } from "../modules/telegram/auth/telegram.routes.js";
import { chatRouter } from "../modules/chat/chat.routes.js";
import { uploadRouter } from "../modules/upload/upload.routes.js";
import { siteUtilityRouter } from "../modules/site-utility/site-utility.routes.js";

import authRoutes from "../modules/auth/auth.routes.js";
const router = Router();

router.use("/auth", authRoutes);

router.use("/client/booking-leads", bookingLeadsRouter);
router.use("/telegram", telegramRouter);
router.use("/chat", chatRouter);
router.use("/files", uploadRouter);
router.use("/site-utilities", siteUtilityRouter);

export default router;

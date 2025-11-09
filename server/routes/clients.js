import express from "express";
const router = express.Router();

// existing grouped routers (unchanged)
import calendarRoutes from "./calendar/client-calendar.js";
import imageSessionRouter from "./image-session/client-image-session.js";
import contractImageRouter from "./contract/client-contract.js";

// new split routers
import leadsRoutes from "./client/leads.js";
import paymentsRoutes from "./client/payments.js";
import uploadsRoutes from "./client/uploads.js";
import imgSessionExtras from "./client/image-session.js";
import notesRoutes from "./client/notes.js";
import languagesRoutes from "./client/languages.js";
import telegramRoutes from "./client/telegram.js";

// mount
router.use("/calendar", calendarRoutes);
router.use("/image-session", imageSessionRouter);
router.use("/image-session", imgSessionExtras);
router.use("/contracts", contractImageRouter);

router.use(leadsRoutes);
router.use(paymentsRoutes);
router.use(uploadsRoutes);
router.use(notesRoutes);
router.use(languagesRoutes);
router.use(telegramRoutes);

export default router;

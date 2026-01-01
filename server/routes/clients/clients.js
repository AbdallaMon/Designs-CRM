import express from "express";
const router = express.Router();

// existing grouped routers (unchanged)
import calendarRoutes from "../calendar/client-calendar.js";
import imageSessionRouter from "../image-session/client-image-session.js";
import contractImageRouter from "../contract/client-contract.js";

// new split routers
import leadsRoutes from "../client/leads.js";
import paymentsRoutes from "../client/payments.js";
import uploadsRoutes from "../client/uploads.js";
import imgSessionExtras from "../client/image-session.js";
import notesRoutes from "../client/notes.js";
import languagesRoutes from "../client/languages.js";
import telegramRoutes from "../client/telegram.js";
import chatRoomsRouter from "../client/chat/rooms.js";
import chatMessagesRouter from "../client/chat/messages.js";
import chatMembersRouter from "../client/chat/members.js";
import chatFilesRouter from "../client/chat/files.js";
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
router.use("/chat/rooms", chatRoomsRouter);
router.use("/chat", chatMessagesRouter);
router.use("/chat/rooms", chatMembersRouter);
router.use("/chat/rooms", chatFilesRouter);
export default router;

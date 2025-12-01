/**
 * Client Routes
 *
 * This module handles all client-facing routes including
 * leads, calendar, image sessions, contracts, and more.
 */

import express from "express";
const router = express.Router();

// Grouped routers from sibling folders
import calendarRoutes from "../calendar/client-calendar.js";
import imageSessionRouter from "../image-session/client-image-session.js";
import contractImageRouter from "../contract/client-contract.js";

// Split routers from this folder
import leadsRoutes from "./leads.js";
import paymentsRoutes from "./payments.js";
import uploadsRoutes from "./uploads.js";
import imgSessionExtras from "./image-session.js";
import notesRoutes from "./notes.js";
import languagesRoutes from "./languages.js";
import telegramRoutes from "./telegram.js";

// Mount grouped routers
router.use("/calendar", calendarRoutes);
router.use("/image-session", imageSessionRouter);
router.use("/image-session", imgSessionExtras);
router.use("/contracts", contractImageRouter);

// Mount split routers
router.use(leadsRoutes);
router.use(paymentsRoutes);
router.use(uploadsRoutes);
router.use(notesRoutes);
router.use(languagesRoutes);
router.use(telegramRoutes);

export default router;

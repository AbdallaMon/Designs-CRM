import { Router } from "express";
import {
  getTokenData,
  verifyTokenAndHandleAuthorization,
} from "../../services/main/utility/utility.js";

// Sub-route routers
import clientLeadsRoutes from "./client-leads.js";
import projectsRoutes from "./projects.js";
import tasksRoutes from "./tasks.js";
import updatesRoutes from "./updates.js";
import dashboardRoutes from "./dashboard.js";
import deliveryRoutes from "./delivery.js";
import utilitiesRoutes from "./utilities.js";
import salesStagesRoutes from "./sales-stages.js";
import reviewsRoutes from "./reviews.js";

// External routers (already organized)
import questionsRoutes from "../questions/questions.js";
import calendarRoutes from "../calendar/calendar.js";
import coursesRouter from "../courses/staffCourses.js";
import contractRouter from "../contract/contracts.js";
import imageSessionRouter from "../image-session/image-session.js";
import siteUtilitiesServices from "../site-utilities/siteUtility.js";

// Chat routers
import chatRoomsRouter from "../chat/rooms.js";
import chatMessagesRouter from "../chat/messages.js";
import chatMembersRouter from "../chat/members.js";
import chatFilesRouter from "../chat/files.js";

import {
  addNote,
  deleteAModel,
  getNotes,
} from "../../services/main/shared/index.js";

const router = Router();

/* ======================================================================================= */
/*                                  Global Auth Middleware                                 */
/* ======================================================================================= */

router.use(async (req, res, next) => {
  await verifyTokenAndHandleAuthorization(req, res, next, "SHARED");
});

/* ======================================================================================= */
/*                                  External Sub-Routers                                   */
/* ======================================================================================= */

router.use("/courses", coursesRouter);
router.use("/contracts", contractRouter);
router.use("/site-utilities", siteUtilitiesServices);
router.use("/questions", questionsRoutes);
router.use("/calendar", calendarRoutes);
router.use("/image-session", imageSessionRouter);

// Chat routes
router.use("/chat/rooms", chatRoomsRouter);
router.use("/chat", chatMessagesRouter);
router.use("/chat/rooms", chatMembersRouter);
router.use("/chat/rooms", chatFilesRouter);

/* ======================================================================================= */
/*                                  Feature Sub-Routers                                    */
/* ======================================================================================= */

// Client leads management (with contracts, reminders, payments, notes)
router.use("/client-leads", clientLeadsRoutes);

// Projects management (includes designer assignments, status updates)
router.use("/projects", projectsRoutes);

// Tasks & modifications
router.use("/tasks", tasksRoutes);

// Updates & approvals workflow
router.use("/updates", updatesRoutes);

// Dashboard & analytics
router.use("/dashboard", dashboardRoutes);

// Calendar availability & scheduling
router.use("/calendar-management", calendarRoutes);

// Delivery schedules & timeline
router.use("/delivery", deliveryRoutes);

// Utilities (notifications, logs, users, helpers)
router.use("/utilities", utilitiesRoutes);

// Sales stages & reminders
router.use("/sales-stages", salesStagesRoutes);

// Reviews & OAuth integration
router.use("/reviews", reviewsRoutes);
router.get("/notes", async (req, res) => {
  try {
    const searchParams = req.query;
    const notes = await getNotes(searchParams);
    res.status(200).json({ data: notes });
  } catch (error) {
    console.log(error, "error");
    res.status(500).json({ message: error.message });
  }
});
router.post("/notes", async (req, res) => {
  try {
    const token = getTokenData(req, res);
    const isAdmin = token.role === "ADMIN" || token.role === "SUPER_ADMIN";

    const newNote = await addNote({
      ...req.body,
      userId: token.id,
      isAdmin,
    });
    res.status(200).json(newNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const token = getTokenData(req, res);
    const isAdmin = token.role === "ADMIN" || token.role === "SUPER_ADMIN";
    const isSuperSales = token.isSuperSales;
    const newNote = await deleteAModel({
      id: req.params.id,
      isAdmin,
      isSuperSales,
      data: req.body,
    });
    res.status(200).json(newNote);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
